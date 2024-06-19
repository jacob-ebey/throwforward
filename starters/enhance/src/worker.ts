// @ts-expect-error - no types
import enhance from "@enhance/ssr";

import browserEntry from "bridge:./browser.ts";

const html = enhance() as typeof String.raw;

function Shell(children: string) {
	return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta
					name="htmx-config"
					content=${JSON.stringify({
						globalViewTransitions: true,
					})}
				/>

				<script type="module" src="${browserEntry}"></script>
      </head>
      <body
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
        ${children}
      </body>
    </html>
  `;
}

export default {
	fetch(request, env) {
		let status = 200;
		let body: string;

		const url = new URL(request.url);
		switch (url.pathname) {
			case "/":
				body = Shell(html`
          <main>
            <h1>Home</h1>
          </main>
        `);
				break;
			case "/about":
				body = Shell(html`
          <main>
            <h1>About</h1>
          </main>
        `);
				break;
			default:
				status = 404;
				body = Shell(html`
          <main>
            <h1>404 Not Found</h1>
          </main>
        `);
		}

		return new Response(body, {
			status,
			headers: {
				"Content-Type": "text/html",
			},
		});
	},
} satisfies ExportedHandler;
