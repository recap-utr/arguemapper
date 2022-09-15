import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
});
