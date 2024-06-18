import { defineConfig } from "tsup";

export default [
	defineConfig({
		entry: ["src/vite.ts"],
		format: ["esm"],
		platform: "node",
		dts: true,
		external: ["@hono/node-server", "@jacob-ebey/cf-vite-plugin", "vite", "ws"],
	}),
];
