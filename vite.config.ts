import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { esmExternalRequirePlugin } from "rolldown/plugins";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Two build targets, each with its own output directory so that building one does not wipe the
// other (vite empties `outDir` on every build):
//   - default: the standalone single-page app (vite build)      -> dist/app
//   - LIB=1:   the embeddable library (ESM + .d.ts)             -> dist/lib
const isLib = process.env.LIB === "1";

// Dependencies the host app must provide, so multiple instances share one React/MUI/emotion.
const peerDeps = [
  "react",
  "react-dom",
  "@emotion/react",
  "@emotion/styled",
  "@mui/material",
  "@mui/lab",
  "@xyflow/react",
  "notistack",
  "material-ui-confirm",
];

// Each peer plus its subpaths, e.g. react/jsx-runtime or @mui/material/styles. The trailing
// boundary keeps `react` from also matching unrelated deps such as react-hotkeys-hook.
const peerDepPatterns = peerDeps.map((dep) => new RegExp(`^${dep}(/|$)`));

export default defineConfig({
  plugins: [
    react(),
    ...(isLib
      ? [
          // `entryRoot` keeps the declarations next to lib.js instead of under an extra src/.
          dts({ tsconfigPath: "./tsconfig.json", include: ["src"], entryRoot: "src" }),
          // Marks the peers external and, unlike build.rollupOptions.external, rewrites the
          // `require` calls that bundled CommonJS deps make for them (the use-sync-external-store
          // shim behind zustand requires react) into ESM imports. Browsers have no `require`,
          // so those calls would throw at runtime. The peers must be listed here only,
          // because the plugin skips anything build.rollupOptions.external already covers.
          esmExternalRequirePlugin({ external: peerDepPatterns }),
        ]
      : []),
  ],
  server: {
    proxy: {
      "/api/aifdb": {
        target: "https://aifdb.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aifdb/, ""),
      },
      "/api/wikipedia": {
        target: "https://api.wikimedia.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikipedia/, ""),
      },
    },
  },
  build: {
    outDir: isLib ? "dist/lib" : "dist/app",
    chunkSizeWarningLimit: 5000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    ...(isLib
      ? {
          // public/ holds the standalone app's favicon, manifest and robots.txt, none of which
          // belong in a library bundle.
          copyPublicDir: false,
          lib: {
            entry: resolve(__dirname, "src/lib.ts"),
            formats: ["es"] as const,
            fileName: "lib",
          },
        }
      : {}),
  },
  resolve: {
    alias: {
      "@root": resolve(__dirname),
      "@": resolve(__dirname, "src"),
    },
    conditions: ["mui-modern", "module", "browser", "development|production"],
  },
});
