import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8001",
      "/radio/api": "http://localhost:8002",
      "/stream": "http://localhost:8000/teststream",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
