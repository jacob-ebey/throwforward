// @ts-expect-error - bad types
import concat from "@vituum/vite-plugin-concat";
import throwforward, { pages } from "throwforward-dev/vite";
import { defineConfig } from "vite";

const browserEntry = "src/browser.ts";
const serverEntry = "src/server.tsx";
const durableObjectsEntry = "src/durable-objects.ts";
const wranglerConfig = "wrangler.dev.toml";

export default defineConfig(({ command }) => ({
	css: {
		transformer: "lightningcss",
	},
	environments: {
		client: {
			build: {
				rollupOptions: {
					input: [browserEntry, "/src/global.css"],
				},
			},
		},
		ssr: {
			dev: {
				optimizeDeps: {
					include: [
						"highlight.js/lib/core",
						"highlight.js/lib/languages/javascript",
					],
				},
			},
		},
		durable_objects: {
			build: {
				emptyOutDir: false,
				copyPublicDir: false,
				rollupOptions: {
					input: durableObjectsEntry,
				},
			},
		},
	},
	plugins: [
		concat({
			input: [browserEntry],
		}),
		pages({ environment: "ssr", entry: serverEntry, outDir: "dist/pages" }),
		throwforward({
			environments: ["ssr", "durable_objects"],
			serverEntry,
			wranglerConfig,
			durableObjects: {
				RATE_LIMITER: {
					environment: "durable_objects",
					file: "/src/durable-objects/rate-limiter.ts",
				},
			},
		}),
	],
}));
