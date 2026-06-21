// server/src/index.js
// Main entry point — creates the Express app and starts the server

require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
}); // Must be the very first line
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const tasksRoute = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────
// Middleware — runs on every request in this order
// ─────────────────────────────────────────────────────

// Adds security headers to every response (XSS protection, etc.)
app.use(helmet());

// CORS — only enabled in development.
// In production, React and the API are served from the same
// domain via Nginx so there are no cross-origin requests at all.
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173", // Vite dev server
      credentials: true,
    })
  );
}

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Log every request: GET /api/tasks 200 8ms
app.use(morgan("dev"));

// ─────────────────────────────────────────────────────
// Health check endpoint
// Must be defined BEFORE any authentication middleware.
// The GCP Load Balancer calls this every 10 seconds to
// decide whether this VM should receive traffic.
// If it returns anything other than 200, the VM is marked
// unhealthy and taken out of rotation.
// ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// ─────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────
app.use("/api/tasks", tasksRoute);

// ─────────────────────────────────────────────────────
// 404 handler — catches any route not matched above
// ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred" });
});

// ─────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Tasks:  http://localhost:${PORT}/api/tasks`);
});

// ─────────────────────────────────────────────────────
// Graceful shutdown
// When PM2 or the OS sends SIGTERM (e.g. during a rolling
// deployment), finish handling in-flight requests before
// exiting. This is what makes zero-downtime deployments work.
// ─────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received — shutting down gracefully");
  process.exit(0);
});
