import throwforward, { pages } from "throwforward-dev/vite";
import { defineConfig } from "vite";

const serverEntry = "src/worker.ts";

export default defineConfig({
	environments: {
		client: {
			build: {
				rollupOptions: {
					input: ["src/browser.ts"],
				},
			},
		},
	},
	plugins: [
		pages({ environment: "ssr", entry: serverEntry }),
		throwforward({
			environments: ["ssr"],
			serverEntry,
		}),
	],
});
