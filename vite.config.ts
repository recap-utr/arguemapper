import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

process.env.BROWSER = "chrome";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  build: {
    target: "es2020",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
});
