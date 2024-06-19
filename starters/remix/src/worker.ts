import { createRequestHandler } from "@remix-run/cloudflare";
// @ts-expect-error - no types
import * as build from "virtual:remix/server-build";

const handler = createRequestHandler(build, import.meta.env.MODE);

export default {
	fetch(request, env) {
		return handler(request, { env });
	},
} satisfies ExportedHandler;
