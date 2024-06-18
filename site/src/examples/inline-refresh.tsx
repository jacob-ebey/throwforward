import { Hono } from "hono";

import { CodePreview } from "../components/code-preview.js";

import source from "./inline-refresh.js?raw";

export const app = new Hono();
app.get("/inline-refresh/api/refresh-weather", async (c) => {
	return c.html(`Weather: ${Math.floor(Math.random() * 100)}f`);
});

app.get("/inline-refresh", (c) => {
	return c.render(
		<article>
			<h1>Inline Refresh</h1>
			<hr />
			<p>
				Sometimes you want to refresh a part of the page without reloading the
				whole page. This is a common pattern for things like weather widgets,
				chat messages, and more. In this example, we'll show how to use htmx to
				refresh the weather without reloading the whole page.
			</p>
			<blockquote>
				<strong>Note:</strong> This example also works without JavaScript via a
				full page reload.
			</blockquote>

			<br />

			<div class="window">
				<div class="title-bar">
					<div class="title-bar-text">Weather example</div>
				</div>
				<form
					class="window-body has-space"
					hx-get="/inline-refresh/api/refresh-weather"
					hx-target="find p"
					hx-indicator="closest form"
					hx-aria-disabled="button[type=submit]"
					hx-swap="transition:false"
				>
					<p aria-live="polite">Weather: {Math.floor(Math.random() * 100)}f</p>
					<div class="inline">
						<button type="submit">Refresh weather</button>
						<span
							class="htmx-indicator loader animate"
							aria-label="Refreshing weather"
						/>
					</div>
				</form>
			</div>

			<br />

			<CodePreview source={source} />
		</article>,
	);
});
