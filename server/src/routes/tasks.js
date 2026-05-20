// server/src/routes/tasks.js
// CRUD routes for the tasks resource

const express = require("express");
const router = express.Router();
const db = require("../db");

// ─────────────────────────────────────────────────────
// GET /api/tasks
// Returns all tasks, newest first
// ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/tasks/:id
// Returns a single task by ID
// ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching task:", err.message);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/tasks
// Creates a new task
// Body: { title: string, description?: string }
// ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await db.query(
      `INSERT INTO tasks (title, description)
       VALUES ($1, $2)
       RETURNING *`,
      [title.trim(), description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ─────────────────────────────────────────────────────
// PATCH /api/tasks/:id
// Partially updates a task
// Body: { title?: string, description?: string, completed?: boolean }
// ─────────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Fetch the existing task so we can merge only the changed fields
    const existing = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = existing.rows[0];

    const result = await db.query(
      `UPDATE tasks
       SET
         title       = $1,
         description = $2,
         completed   = $3,
         updated_at  = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        title !== undefined ? title.trim() : task.title,
        description !== undefined ? description : task.description,
        completed !== undefined ? completed : task.completed,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// Deletes a task
// ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", task: result.rows[0] });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;
