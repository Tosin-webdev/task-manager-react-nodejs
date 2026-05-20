// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Any request to /api gets forwarded to the Node.js server
      // This mirrors exactly what Nginx does in production
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Output to client/build/ instead of Vite's default client/dist/
    // Tutorial 2 references this exact path in the Nginx config
    outDir: "build",
  },
});
