import { defineConfig } from "drizzle-kit";
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/schema.ts",
	out: "./migrations",
	dbCredentials: {
		url: "file:./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/fbab743ec5e74aff6fec1020b2e7580806ae4a2ddaa6a7e0b8f9dee7003380d4.sqlite",
	},
});
