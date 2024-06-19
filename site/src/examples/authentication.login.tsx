import { compare } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { ZodError, z } from "zod";

import { CodePreview } from "../components/code-preview.js";
import type { Env } from "../env.js";
import type { AuthVariables } from "../middleware/authentication.js";
import {
	USER_ID_COOKIE,
	authenticationMiddleware,
} from "../middleware/authentication.js";

import source from "./authentication.login.js?raw";

import * as schema from "./authentication.schema.js";

const loginSchema = z.object({
	intent: z.literal("login"),
	email: z.string().trim().email(),
	password: z.string().min(1),
});

export const app = new Hono<{
	Bindings: Env;
	Variables: AuthVariables & {
		formData: FormData | undefined;
		formError: ZodError | null | undefined;
	};
}>()
	.use(authenticationMiddleware)
	.post("/authentication", async (c, next) => {
		const db = drizzle(c.env.DB);

		const formData = await c.req.formData();
		c.set("formData", formData);

		const parsed = loginSchema.safeParse(Object.fromEntries(formData));

		if (!parsed.success) {
			c.set("formError", parsed.error);
		} else {
			const { data } = parsed;

			const genericError = new ZodError([
				{
					code: "custom",
					path: ["email"],
					message: "Invalid email or password.",
				},
			]);

			const [user] = await db
				.select({
					id: schema.user.id,
					password: schema.user.password,
				})
				.from(schema.user)
				.where(eq(schema.user.email, data.email))
				.limit(1);

			if (!user) {
				c.set("formError", genericError);
				return next();
			}

			const passwordMatch = await compare(data.password, user.password);
			if (!passwordMatch) {
				c.set("formError", genericError);
				return next();
			}

			c.set("userId", String(user.id));
			await setSignedCookie(
				c,
				USER_ID_COOKIE,
				String(user.id),
				c.env.COOKIE_SECRET,
			);
		}

		return next();
	})
	.on(["GET", "POST"], "/authentication", async (c) => {
		const userId = c.get("userId");
		if (userId) {
			const defaultRedirect = "/authentication/logout";
			let redirectTo = c.req.query("redirect") ?? defaultRedirect;
			if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
				redirectTo = defaultRedirect;
			}
			return c.redirect(redirectTo);
		}

		const formError = c.get("formError");
		const formData = c.get("formData");
		const defaultEmail = String(formData?.get("email") ?? "");

		const loginError:
			| z.typeToFlattenedError<z.infer<typeof loginSchema>, string>
			| undefined = formError?.flatten();

		return c.render(
			<article>
				<h1>Authentication / Login</h1>
				<hr />
				<p>
					This is a simple example of how to use cookies to manage
					authentication.
				</p>
				<blockquote>
					<strong>Note:</strong> This example also works without JavaScript via
					a full page reload.
				</blockquote>

				<br />

				<div class="window">
					<div class="title-bar">
						<div class="title-bar-text">Login example</div>
					</div>
					<form
						class="window-body has-space"
						method="post"
						hx-indicator="closest form"
						hx-aria-disabled="find button[type=submit]"
					>
						<input type="hidden" name="intent" value="login" />

						<div class="field-row-stacked">
							<label for="login-email">Email</label>
							<input
								id="login-email"
								name="email"
								type="email"
								autocomplete="current-email"
								aria-labelledby="login-email-error"
								value={defaultEmail}
							/>
							{loginError?.fieldErrors.email && (
								<label id="login-email-error" class="error">
									{loginError.fieldErrors.email}
								</label>
							)}
						</div>
						<div class="field-row-stacked">
							<label for="login-password">Password</label>
							<input
								id="login-password"
								name="password"
								type="password"
								autocomplete="current-password"
								aria-labelledby="login-password-error"
							/>
							{loginError?.fieldErrors.password && (
								<label id="login-password-error" class="error">
									{loginError.fieldErrors.password}
								</label>
							)}
						</div>
						<p>
							Don't have an account?{" "}
							<a href={"/authentication/signup"}>Signup</a>
						</p>
						<div class="field-row">
							<button type="submit">Login</button>
							<span
								role="alert"
								aria-live="assertive"
								aria-label="Logging in"
								class="htmx-indicator loader animate"
							/>
						</div>
					</form>
				</div>

				<br />

				<CodePreview source={source} />
			</article>,
		);
	});
