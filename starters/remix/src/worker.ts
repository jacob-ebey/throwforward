// @ts-expect-error - no types
import * as build from "virtual:remix/server-build";
import { createRequestHandler } from "@remix-run/cloudflare";

const handler = createRequestHandler(build, import.meta.env.MODE);

export default {
	fetch(request, env) {
		return handler(request, { env });
	},
} satisfies ExportedHandler;
