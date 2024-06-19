import { hash } from "bcrypt-ts";
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

import source from "./authentication.signup.js?raw";

import * as schema from "./authentication.schema.js";

const signupSchema = z.object({
	intent: z.literal("signup"),
	name: z.string().trim().min(1),
	email: z.string().trim().email(),
	password: z.string().min(8),
	verifyPassword: z.string().min(8),
});

export const app = new Hono<{
	Bindings: Env;
	Variables: AuthVariables & {
		formData: FormData | undefined;
		formError: ZodError | null | undefined;
	};
}>()
	.use(authenticationMiddleware)
	.post("/authentication/signup", async (c, next) => {
		const db = drizzle(c.env.DB);

		const formData = await c.req.formData();
		c.set("formData", formData);

		const parsed = signupSchema.safeParse(Object.fromEntries(formData));

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

			if (data.password !== data.verifyPassword) {
				c.set(
					"formError",
					new ZodError([
						{
							code: "custom",
							path: ["verifyPassword"],
							message: "Passwords do not match.",
						},
					]),
				);
			}

			const [user] = await db
				.select({
					id: schema.user.id,
					password: schema.user.password,
				})
				.from(schema.user)
				.where(eq(schema.user.email, data.email))
				.limit(1);

			if (user) {
				c.set("formError", genericError);
				return next();
			}

			const password = await hash(data.password, 12);
			const [insertedUser] = await db
				.insert(schema.user)
				.values({
					name: data.name,
					email: data.email,
					password,
				})
				.returning({ id: schema.user.id });

			if (!insertedUser) {
				c.set(
					"formError",
					new ZodError([
						{
							code: "custom",
							path: ["email"],
							message: "Failed to create user.",
						},
					]),
				);
				return next();
			}

			c.set("userId", String(insertedUser.id));
			await setSignedCookie(
				c,
				USER_ID_COOKIE,
				String(insertedUser.id),
				c.env.COOKIE_SECRET,
			);
		}

		return next();
	})
	.on(["GET", "POST"], "/authentication/signup", async (c) => {
		const userId = c.get("userId");
		if (userId) {
			return c.redirect("/authentication/logout");
		}

		const formError = c.get("formError");
		const formData = c.get("formData");
		const defaultEmail = String(formData?.get("email") ?? "");

		const signupError:
			| z.typeToFlattenedError<z.infer<typeof signupSchema>, string>
			| undefined = formError?.flatten();

		return c.render(
			<article>
				<h1>Authentication / Signup</h1>
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
						<div class="title-bar-text">Signup example</div>
					</div>
					<form
						class="window-body has-space"
						method="post"
						hx-indicator="closest form"
						hx-aria-disabled="find button[type=submit]"
						id="signup-form"
					>
						<input type="hidden" name="intent" value="signup" />

						<div class="field-row-stacked">
							<label for="signup-name">Name</label>
							<input
								id="signup-name"
								name="name"
								type="text"
								aria-labelledby="signup-name-error"
							/>
							{signupError?.fieldErrors.name && (
								<label id="signup-name-error" class="error">
									{signupError.fieldErrors.name}
								</label>
							)}
						</div>
						<div class="field-row-stacked">
							<label for="signup-email">Email</label>
							<input
								id="signup-email"
								name="email"
								type="email"
								autocomplete="current-email"
								aria-labelledby="signup-email-error"
								value={defaultEmail}
							/>
							{signupError?.fieldErrors.email && (
								<label id="signup-email-error" class="error">
									{signupError.fieldErrors.email}
								</label>
							)}
						</div>
						<div class="field-row-stacked">
							<label for="signup-password">Password</label>
							<input
								id="signup-password"
								name="password"
								type="password"
								autocomplete="new-password"
								aria-labelledby="signup-password-error"
							/>
							{signupError?.fieldErrors.password && (
								<label id="signup-password-error" class="error">
									{signupError.fieldErrors.password}
								</label>
							)}
						</div>
						<div class="field-row-stacked">
							<label for="signup-verifyPassword">Verify Password</label>
							<input
								id="signup-verifyPassword"
								name="verifyPassword"
								type="password"
								autocomplete="new-password"
								aria-labelledby="signup-verifyPassword-error"
							/>
							{signupError?.fieldErrors.verifyPassword && (
								<label id="signup-verifyPassword-error" class="error">
									{signupError.fieldErrors.verifyPassword}
								</label>
							)}
						</div>
						<p>
							Already have an account? <a href="/authentication">Login</a>
						</p>
						<div class="field-row">
							<button type="submit">Signup</button>
							<span
								aria-live="assertive"
								aria-label="Signing up"
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

export type SignupAPI = typeof app;
