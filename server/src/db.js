// server/src/db.js
// Creates and exports a PostgreSQL connection pool.
// A pool keeps multiple connections open and reuses them —
// far more efficient than opening a new connection per request.

const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 20, // Max open connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Error if cannot connect within 2s
});

// Test the connection on startup.
// If credentials are wrong we want to know immediately,
// not on the first incoming request.
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to PostgreSQL successfully");
  release();
});

module.exports = pool;
