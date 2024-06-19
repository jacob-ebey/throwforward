import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";

import browserEntry from "bridge:./browser.js";
import stylesEntry from "bridge:./global.css";

import * as docs from "./docs.js";
import type { Env } from "./env.js";
import * as authentication from "./examples/authentication.js";
import * as inlineRefresh from "./examples/inline-refresh.js";
import * as llm from "./examples/llm.js";
import * as trellix from "./examples/trellix.js";

const app = new Hono<{ Bindings: Env }>();

app.use(
	jsxRenderer(
		({ children }) => (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<Entry entry={stylesEntry} />

					<title>Throwforward Stack</title>
					<meta name="description" content="Cloudflare-Powered Throwforward" />

					<link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
					<link rel="manifest" href="/assets/site.webmanifest" />

					<meta
						name="htmx-config"
						content={JSON.stringify({
							includeIndicatorStyles: false,
							globalViewTransitions: true,
						})}
					/>
					<Entry entry={browserEntry} />
				</head>
				<body
					hx-ext="aria-disabled"
					hx-boost="true"
					hx-swap="innerHTML"
					hx-indicator="#global-indicator"
					hx-target-404="body"
					class="surface has-scrollbar"
				>
					<div id="global-indicator">
						<span
							class="htmx-indicator loader animate"
							aria-label="Request in progress"
						/>
						<div class="menu-toggle">
							<button
								type="button"
								onclick="
              const menu = document.getElementById('menu');
              if (menu.style.display) menu.style.display = '';
              else menu.style.display = 'flex';
              "
							>
								Menu
							</button>
						</div>
					</div>
					<aside id="menu">
						<ul class="tree-view has-connector has-collapse-button has-container has-scrollbar">
							<li>
								<a href="/">Home</a>
							</li>
							<li>
								<details open>
									<summary>Tools</summary>
									<ul>
										<li>
											<details open>
												<summary>Middleware</summary>
												<ul>
													<li>
														<a href="/middleware/authentication">
															Authentication
														</a>
													</li>
												</ul>
											</details>
										</li>
										<li>
											<details open>
												<summary>DurableObjects</summary>
												<ul>
													<li>
														<a href="/durable-object/client">Hono Client</a>
													</li>
													<li>
														<a href="/durable-object/rate-limiter">
															Rate Limiter
														</a>
													</li>
												</ul>
											</details>
										</li>
										<li>
											<details open>
												<summary>HTMX Extensions</summary>
												<ul>
													<li>
														<a href="/htmx/aria-disabled">Aria Disabled</a>
													</li>
													<li>
														<a href="/htmx/markdown">Markdown</a>
													</li>
													<li>
														<a href="/htmx/sortable">Sortable</a>
													</li>
													<li>
														<a href="/htmx/helpers">Extension Helpers</a>
													</li>
												</ul>
											</details>
										</li>
									</ul>
								</details>
							</li>
							<li>
								<details open>
									<summary>Examples</summary>
									<ul>
										<li>
											<a href="/inline-refresh">Inline Refresh</a>
										</li>
										<li>
											<details open>
												<summary>Authentication</summary>
												<ul>
													<li>
														<a href="/authentication">Login</a>
													</li>
													<li>
														<a href="/authentication/signup">Signup</a>
													</li>
													<li>
														<a href="/authentication/logout">
															Logout / Protected
														</a>
													</li>
												</ul>
											</details>
										</li>
										<li>
											<details open>
												<summary>Protected</summary>
												<ul>
													<li>
														<a href="/llm">LLM's / Streaming</a>
													</li>
													<li>
														<a href="/trellix">Trellix</a>
													</li>
												</ul>
											</details>
										</li>
									</ul>
								</details>
							</li>
						</ul>
					</aside>
					<main>{children}</main>
					{import.meta.env.PROD && (
						<script
							defer
							src="https://static.cloudflareinsights.com/beacon.min.js"
							data-cf-beacon='{"token": "a01c9d0a93f447869b67c7ca3cddc43e"}'
						/>
					)}
				</body>
			</html>
		),
		{
			docType: true,
			stream: true,
		},
	),
);

app.route("", docs.app);
app.route("", authentication.app);
app.route("", inlineRefresh.app);
app.route("", llm.app);
app.route("", trellix.app);

app.all("*", (c) => {
	c.status(404);
	return c.render(
		<article>
			<h1>404</h1>
			<hr />
			<p>Not found</p>
		</article>,
	);
});

function Entry({ entry }: { entry: string }) {
	const baseId = entry.replace(/\?.*$/, "");
	if (import.meta.env.PROD && baseId.endsWith(".css")) {
		return <link rel="stylesheet" href={entry} />;
	}
	return <script type="module" src={entry} />;
}

export default app;
