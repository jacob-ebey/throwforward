import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono<{
	Bindings: { state: DurableObjectState };
}>().get(
	"/next",
	zValidator(
		"query",
		z.object({
			msPerRequest: z.coerce.number().min(1),
			msForGracePeriod: z.coerce.number().min(0),
		}),
	),
	async (c) => {
		const { msForGracePeriod, msPerRequest } = c.req.valid("query");

		const value = await c.env.state.blockConcurrencyWhile(async () => {
			let nextAllowedTime =
				(await c.env.state.storage.get<number>("nextAllowedTime")) ?? 0;
			const now = Date.now();

			nextAllowedTime = Math.max(now, nextAllowedTime);
			nextAllowedTime += msPerRequest;
			await c.env.state.storage.put("nextAllowedTime", nextAllowedTime);
			return Math.max(0, nextAllowedTime - now - msForGracePeriod);
		});

		return c.json(value);
	},
);

export type RateLimiterAPI = typeof app;

export class RateLimiter implements DurableObject {
	constructor(private state: DurableObjectState) {}

	async fetch(request: Request): Promise<Response> {
		return app.fetch(request, {
			state: this.state,
		});
	}
}
