import type { Hono } from "hono";
import { hc } from "hono/client";

export function createDurableClient<T extends Hono<any, any, any>>(
	durable?: DurableObjectStub<undefined>,
) {
	return hc<T>("https://durable-object/", {
		fetch: (info: RequestInfo | URL, init?: RequestInit) => {
			if (!durable) {
				throw new Error("Durable Object not available");
			}
			return durable.fetch(
				typeof info === "string"
					? info
					: info instanceof URL
						? info.href
						: info,
				init,
			);
		},
	});
}
