export type Env = {
	__STATIC_CONTENT?: KVNamespace;
	COOKIE_SECRET: string;
	DB: D1Database;
	GROQ_API_KEY: string;
	RATE_LIMITER: DurableObjectNamespace;
};
