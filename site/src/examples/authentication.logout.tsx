import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";

import { CodePreview } from "../components/code-preview.js";
import type { AuthVariables } from "../middleware/authentication.js";
import {
	USER_ID_COOKIE,
	authenticationMiddleware,
} from "../middleware/authentication.js";

import source from "./authentication.logout.js?raw";

export const app = new Hono<{
	Variables: AuthVariables;
}>()
	.use(authenticationMiddleware)
	.post("/authentication/logout", async (c, next) => {
		c.set("userId", undefined);
		await setSignedCookie(c, USER_ID_COOKIE, "", c.env.COOKIE_SECRET, {
			maxAge: 0,
		});
		return next();
	})
	.on(["GET", "POST"], "/authentication/logout", async (c) => {
		const userId = await c.get("userId");
		if (!userId) {
			return c.redirect("/authentication");
		}

		return c.render(
			<article>
				<h1>Logout / Protected</h1>
				<hr />
				<p>
					This is a protected page. You can only access this page if you are
					authenticated.
				</p>
				<blockquote>
					<strong>Note:</strong> This example also works without JavaScript via
					a full page reload.
				</blockquote>

				<br />
				<div class="window">
					<div class="title-bar">
						<div class="title-bar-text">Logout example</div>
					</div>
					<form
						class="window-body has-space"
						method="post"
						action="/authentication/logout"
						hx-aria-disabled="find button[type=submit]"
					>
						<button type="submit">Logout</button>
					</form>
				</div>

				<br />

				<CodePreview source={source} />
			</article>,
		);
	});
