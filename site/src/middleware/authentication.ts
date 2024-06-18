import type { Context, Env } from "hono";
import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const USER_ID_COOKIE = "userId";

export type AuthEnvironment = {
	COOKIE_SECRET: string;
};

export type AuthVariables = {
	userId: string | undefined;
};

export const authenticationMiddleware = createMiddleware<{
	Bindings: AuthEnvironment;
	Variables: AuthVariables;
}>(async (c, next) => {
	const userId = await getSignedCookie(c, c.env.COOKIE_SECRET, "userId");
	c.set("userId", userId || undefined);

	return next();
});

export const requireAuthentication = <E extends Env>({
	redirect,
}: { redirect: string | ((c: Context<E>) => string) }) =>
	createMiddleware<{
		Bindings: E["Bindings"];
		Variables: E["Variables"] & {
			userId: string;
		};
	}>(async (c, next) => {
		if (!c.get("userId")) {
			return c.redirect(
				typeof redirect === "function"
					? redirect(c as unknown as Context<E>)
					: redirect,
			);
		}
		return next();
	});
