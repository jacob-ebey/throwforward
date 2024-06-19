import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";

import browserEntry from "bridge:./browser.ts";

const app = new Hono()
	.use(
		jsxRenderer(({ children }) => (
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta
						name="htmx-config"
						content={JSON.stringify({
							globalViewTransitions: true,
						})}
					/>

					<script type="module" src={browserEntry} />
				</head>
				<body
					hx-ext="aria-disabled"
					hx-boost="true"
					hx-swap="innerHTML"
					hx-target-404="body"
				>
					<nav>
						<ul>
							<li>
								<a href="/">Home</a>
							</li>
							<li>
								<a href="/about">About</a>
							</li>
						</ul>
					</nav>
					{children}
				</body>
			</html>
		)),
	)
	.get("/", (c) => {
		return c.render(
			<main>
				<h1>Home</h1>
			</main>,
		);
	})
	.get("/about", (c) => {
		return c.render(
			<main>
				<h1>About</h1>
			</main>,
		);
	});

export default app;
