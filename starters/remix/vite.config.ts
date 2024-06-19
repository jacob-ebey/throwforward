import throwforward, { reactRouter } from "throwforward-dev/vite";
import { defineConfig } from "vite";

const serverEntry = "src/worker.ts";

export default defineConfig({
	environments: {
		client: {},
	},
	plugins: [
		throwforward({
			environments: ["ssr"],
			serverEntry,
		}),
		reactRouter({
			serverEntry,
			config: {
				appDirectory: "src",
				future: {
					unstable_singleFetch: true,
					v3_fetcherPersist: true,
					v3_relativeSplatPath: true,
					v3_throwAbortReason: true,
				},
			},
		}),
	],
});
