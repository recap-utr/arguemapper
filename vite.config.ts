import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		checker({
			// https://github.com/fi3ework/vite-plugin-checker/issues/511
			biome: false,
		}),
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
	},
	resolve: {
		conditions: ["mui-modern", "module", "browser", "development|production"],
	},
});
