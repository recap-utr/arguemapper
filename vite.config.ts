import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: "eslint ./src",
        useFlatConfig: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 5000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    conditions: ["mui-modern", "module", "browser", "development|production"],
  },
});
