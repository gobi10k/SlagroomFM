import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  base: "/radio",
  server: {
    proxy: {
      "/radio/api": "http://localhost:8002",
      "/stream": "http://localhost:8000/teststream",
    },
  },
  build: {
    outDir: "../../radio/scheduler/static",
    emptyOutDir: true,
  },
});
