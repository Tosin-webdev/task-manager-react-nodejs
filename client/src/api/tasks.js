// client/src/api/tasks.js
// All API calls are centralised here — not scattered across components.
// This makes it easy to add auth headers or update the base URL later.

import axios from "axios";

// Base URL is /api — no hardcoded hostname needed.
// Vite proxy handles it in development.
// Nginx handles it in production.
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const tasksApi = {
  getAll: async () => {
    const res = await api.get("/tasks");
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  create: async (task) => {
    const res = await api.post("/tasks", task);
    return res.data;
  },

  update: async (id, updates) => {
    const res = await api.patch(`/tasks/${id}`, updates);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
};
