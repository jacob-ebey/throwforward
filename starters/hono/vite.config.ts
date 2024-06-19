import throwforward, { pages } from "throwforward-dev/vite";
import { defineConfig } from "vite";

const serverEntry = "src/worker.tsx";

export default defineConfig({
	environments: {
		client: {
			build: {
				rollupOptions: {
					input: ["src/browser.ts"],
				},
			},
		},
		ssr: {},
	},
	plugins: [
		pages({ environment: "ssr", entry: serverEntry }),
		throwforward({
			environments: ["ssr"],
			serverEntry,
		}),
	],
});
