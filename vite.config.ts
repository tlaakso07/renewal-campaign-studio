import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: "app",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 8787,
    strictPort: true,
    watch: { usePolling: true, interval: 500 },
    fs: {
      strict: true,
      allow: [
        resolve(import.meta.dirname, "app"),
        resolve(import.meta.dirname, "node_modules"),
      ],
    },
  },
  build: { outDir: "../dist", emptyOutDir: true },
});
