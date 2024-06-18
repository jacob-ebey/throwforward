// @ts-expect-error - bad types
import concat from "@vituum/vite-plugin-concat";
import throwforward from "throwforward-dev/vite";
import { defineConfig } from "vite";

const serverEntry = "/src/server.tsx";
const pagesOutDir = "dist";
const wranglerConfig = "./wrangler.dev.toml";
const browserEntry = "/src/browser.ts";
const workerEntry = "/src/_worker.ts";

export default defineConfig(({ command }) => ({
	css: {
		transformer: "lightningcss",
	},
	environments: {
		client: {
			build: {
				outDir: pagesOutDir,
				emptyOutDir: false,
				rollupOptions: {
					input: [browserEntry, "/src/global.css"],
				},
			},
		},
		ssr: {
			nodeCompatible: true,
			webCompatible: true,
			resolve: {
				mainFields: ["module"],
				conditions: ["workerd", "module"],
				noExternal: command !== "build" ? true : undefined,
			},
			build: {
				outDir: pagesOutDir,
				emptyOutDir: false,
				copyPublicDir: false,
				assetsDir: "_server-assets",
				rollupOptions: {
					input: workerEntry,
				},
			},
			dev: {
				optimizeDeps: {
					include: [
						"highlight.js/lib/core",
						"highlight.js/lib/languages/javascript",
					],
				},
			},
		},
	},
	plugins: [
		concat({
			input: [browserEntry],
		}),
		throwforward({
			environments: ["ssr"],
			serverEntry,
			wranglerConfig,
			durableObjects: {
				RATE_LIMITER: {
					environment: "ssr",
					file: "/src/durable-objects/rate-limiter.ts",
				},
			},
		}),
	],
}));
