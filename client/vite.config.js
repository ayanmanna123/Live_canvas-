import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      events: 'events',
      util: 'util',
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  server: {
    open: true,
    port: 5173,
  },
  define: {
    global: 'window',
    'process.env': {},
  },
})