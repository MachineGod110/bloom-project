import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api to your local Express server (see backend README)
// so fetch("/api/...") in api.js works during development without CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
