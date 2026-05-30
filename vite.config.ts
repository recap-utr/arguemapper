import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Two build targets:
//   - default: the standalone single-page app (vite build)
//   - LIB=1:   the embeddable library (ESM + .d.ts) for other React projects
const isLib = process.env.LIB === "1";

// Dependencies the host app must provide, so multiple instances share one React/MUI/emotion.
const peerDeps = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "@emotion/react",
  "@emotion/styled",
  "@mui/material",
  "@mui/lab",
  "@xyflow/react",
  "notistack",
  "material-ui-confirm",
];

export default defineConfig({
  plugins: [
    react(),
    ...(isLib ? [dts({ tsconfigPath: "./tsconfig.json", include: ["src"] })] : []),
  ],
  server: {
    proxy: {
      "/api/aifdb": {
        target: "https://aifdb.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aifdb/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    ...(isLib
      ? {
          lib: {
            entry: resolve(__dirname, "src/lib.ts"),
            formats: ["es"] as const,
            fileName: "lib",
          },
          rollupOptions: {
            external: (id: string) =>
              peerDeps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
          },
        }
      : {}),
  },
  resolve: {
    conditions: ["mui-modern", "module", "browser", "development|production"],
  },
});
