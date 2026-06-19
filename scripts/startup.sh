#!/bin/bash

# Exit immediately if any command fails
# This prevents the VM from partially starting and appearing healthy
set -e

# Log everything to syslog for debugging
exec > >(tee /var/log/startup-script.log | logger -t startup-script -s 2>/dev/console) 2>&1

echo "=== Starting application setup at $(date) ==="

# ─────────────────────────────────────────────
# STEP 1: Read the app version from VM metadata
# Cloud Build sets this when it creates the instance template
# ─────────────────────────────────────────────
APP_VERSION=$(curl -sf \
  "http://metadata.google.internal/computeMetadata/v1/instance/attributes/APP_VERSION" \
  -H "Metadata-Flavor: Google")

echo "=== Deploying version: $APP_VERSION ==="

# ─────────────────────────────────────────────
# STEP 2: Install system dependencies
# ─────────────────────────────────────────────
echo "=== Installing system packages ==="
apt-get update -y
apt-get install -y \
  nginx \
  curl \
  wget \
  unzip \
  jq

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"

# ─────────────────────────────────────────────
# STEP 3: Fetch secrets from Secret Manager
# The VM's service account has permission to read these
# ─────────────────────────────────────────────
echo "=== Fetching secrets from Secret Manager ==="

DB_HOST=$(gcloud secrets versions access latest --secret="db-host")
DB_NAME=$(gcloud secrets versions access latest --secret="db-name")
DB_USER=$(gcloud secrets versions access latest --secret="db-user")
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")

# ─────────────────────────────────────────────
# STEP 4: Pull the application artifact from GCS
# Cloud Build uploads the build artifact here during CI/CD
# ─────────────────────────────────────────────
echo "=== Pulling application artifact ==="
mkdir -p /opt/app
gcloud storage cp gs://ferrous-gate-475902-d4-app-releases/releases/app-${APP_VERSION}.tar.gz /tmp/app.tar.gz
tar -xzf /tmp/app.tar.gz -C /opt/app
rm /tmp/app.tar.gz

# ─────────────────────────────────────────────
# STEP 5: Install Node.js production dependencies
# ─────────────────────────────────────────────
echo "=== Installing Node.js dependencies ==="
cd /opt/app/server
npm install --production --silent

# ─────────────────────────────────────────────
# STEP 6: Write environment variables to a file
# PM2 reads this when starting Node.js
# This file is only readable by root
# ─────────────────────────────────────────────
echo "=== Writing environment config ==="
cat > /opt/app/server/.env.production << EOF
NODE_ENV=production
PORT=3000
DB_HOST=${DB_HOST}
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
EOF

# Secure the env file
chmod 600 /opt/app/server/.env.production
chown root:root /opt/app/server/.env.production

# ─────────────────────────────────────────────
# STEP 7: Configure Nginx
# ─────────────────────────────────────────────
echo "=== Configuring Nginx ==="
cp /opt/app/nginx/default.conf /etc/nginx/nginx.conf
nginx -t  # Test the config before applying
systemctl enable nginx
systemctl restart nginx

# ─────────────────────────────────────────────
# STEP 8: Start Node.js with PM2
# ─────────────────────────────────────────────
echo "=== Starting Node.js with PM2 ==="
mkdir -p /var/log/pm2

# Source the env file so PM2 passes them to Node.js
set -a
source /opt/app/server/.env.production
set +a

cd /opt/app/server
pm2 start ecosystem.config.js --env production
pm2 save  # Save process list so PM2 restores after reboot

# Configure PM2 to start on system boot
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo "=== Setup complete at $(date) ==="
echo "=== App version $APP_VERSION is running ==="