export { RateLimiter } from "./durable-objects/rate-limiter.js";

export default {
	fetch() {
		return new Response("Not Found", { status: 404, statusText: "Not Found" });
	},
};
