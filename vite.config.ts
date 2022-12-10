import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx,js,jsx}"',
      },
    }),
  ],
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
