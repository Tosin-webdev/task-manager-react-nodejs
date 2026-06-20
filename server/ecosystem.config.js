// server/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "api",
      script: "./src/index.js",
      instances: "max", // One process per CPU core
      exec_mode: "cluster", // Load balance across cores
      watch: false, // Do not restart on file changes in prod
      max_memory_restart: "512M", // Restart if memory exceeds 512MB
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/pm2/api-error.log",
      out_file: "/var/log/pm2/api-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
