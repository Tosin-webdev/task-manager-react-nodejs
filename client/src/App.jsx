// client/src/App.jsx
import { useState, useEffect } from "react";
import { tasksApi } from "./api/tasks";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all tasks when the component first mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.getAll();
      setTasks(data);
    } catch (err) {
      setError("Failed to load tasks. Is the server running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      const task = await tasksApi.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setTasks([task, ...tasks]); // Add to top of list
      setNewTitle("");
      setNewDesc("");
    } catch (err) {
      setError("Failed to create task.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (task) => {
    try {
      const updated = await tasksApi.update(task.id, {
        completed: !task.completed,
      });
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError("Failed to update task.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tasksApi.delete(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      setError("Failed to delete task.");
      console.error(err);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Task Manager</h1>
        <p className="subtitle">React + Node.js + PostgreSQL</p>
      </header>

      <main className="main">
        {/* Create task form */}
        <section className="card">
          <h2>Add a Task</h2>
          <form onSubmit={handleCreate} className="create-form">
            <input
              type="text"
              placeholder="Task title (required)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={submitting}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              disabled={submitting}
              className="input"
            />
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="btn btn-primary"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </form>
        </section>

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)} className="dismiss">
              ✕
            </button>
          </div>
        )}

        {/* Task list */}
        <section className="card">
          <h2>
            Tasks
            <span className="task-count">
              {tasks.filter((t) => !t.completed).length} remaining
            </span>
          </h2>

          {loading && <p className="muted">Loading tasks...</p>}

          {!loading && tasks.length === 0 && (
            <p className="muted">No tasks yet. Add one above.</p>
          )}

          {!loading && tasks.length > 0 && (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? "completed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task)}
                    className="checkbox"
                  />

                  <div className="task-body">
                    <span className="task-title">{task.title}</span>
                    {task.description && (
                      <span className="task-desc">{task.description}</span>
                    )}
                    <span className="task-date">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="btn btn-delete"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
