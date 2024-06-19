import { Hono } from "hono";
import type { HtmlEscapedString } from "hono/utils/html";

import { CodePreview } from "./components/code-preview.js";
import durableObjectsClientSource from "./durable-object-client.js?raw";
import rateLimiterSource from "./durable-objects/rate-limiter.js?raw";
import ariaDisabledSource from "./extensions/aria-disabled.js?raw";
import htmxHelpersSource from "./extensions/helpers.js?raw";
import htmxMarkdownSource from "./extensions/markdown.js?raw";
import htmxSortableSource from "./extensions/sortable.js?raw";
import authenticationSource from "./middleware/authentication.js?raw";

export const app = new Hono();

app.get("/", async (c) => {
	return c.render(
		<article>
			<h1>Throwforward Stack</h1>
			<hr />
			<p>
				Cloudflare-Powered Innovation: The Throwforward Stack brings legacy app
				building into the 21st century.
			</p>
			<h2>Tech Stack</h2>
			<ul>
				<li>
					<strong>Cloudflare:</strong> Edge computing, web-sockets, caching, DB,
					and more.
				</li>
				<li>
					<strong>Hono:</strong> Routing, middleware, and server-side rendering
					via JSX.
				</li>
				<li>
					<strong>HTMX:</strong> Declarative, progressive enhancement.
				</li>
			</ul>
		</article>,
	);
});

app.get("/docs/:slug", async (c, next) => {
	const slug = c.req.param("slug");
	const response = await fetch(
		`https://github-md.com/jacob-ebey/throwforward/main/docs/${slug}.md`,
	);
	const json = (await response.json()) as {
		attributes: Record<string, string>;
		html: string;
	};
	if (response.status !== 200 || !json || !json.attributes || !json.html) {
		return next();
	}

	return c.render(<article dangerouslySetInnerHTML={{ __html: json.html }} />);
});

app.get("/durable-object/:name", async (c, next) => {
	const name = c.req.param("name");

	let source = "";
	let description: string | Promise<HtmlEscapedString> = "";
	switch (name) {
		case "client":
			source = durableObjectsClientSource;
			description =
				"A simple wrapper that allows an RPC-like interface to DurableObjects.";
			break;
		case "rate-limiter":
			source = rateLimiterSource;
			description = (
				<>
					Sometimes you need to rate limit requests to your server. This
					DurableObject is a simple example of how to rate limit requests based
					on an arbitrary key. One durable-object instance is created per key
					allowing for distributed rate limiters. An example of how to use this
					durable-object can be found at <a href="/llm">/llm</a>.
				</>
			);
			break;
	}

	if (!source) {
		return next();
	}

	return c.render(
		<article>
			<h1>DurableObject {name}</h1>
			<hr />
			<p>{description}</p>

			<CodePreview open source={source} />
		</article>,
	);
});

app.get("/htmx/:name", async (c, next) => {
	const name = c.req.param("name");

	let source = "";
	let description: string | Promise<HtmlEscapedString> = "";
	switch (name) {
		case "aria-disabled":
			source = ariaDisabledSource;
			description =
				"A HTMX extension that adds aria-disabled to elements during requests.";
			break;
		case "helpers":
			source = htmxHelpersSource;
			description = "Helper functions used in various HTMX extensions.";
			break;
		case "markdown":
			source = htmxMarkdownSource;
			description = (
				<>
					A HTMX extension that adds markdown rendering to elements. Add a{" "}
					<code>data-markdown</code> attribute selector that points to an
					element to pull the markdown content from. An example of how to use
					this can be found at <a href="/llm">/llm</a>.
				</>
			);
			break;
		case "sortable":
			source = htmxSortableSource;
			description = (
				<>
					A HTMX extension that adds drag and drop sort events to elements. Add
					a <code>.sortable</code> class to an element to make it sortable. Add
					a <code>data-sortable-group</code> attribute to give it a group name
					to support multiple sortable groups. An example of how to use this can
					be found at <a href="/trellix">/trellix</a>.
				</>
			);
			break;
	}

	if (!source) {
		return next();
	}

	return c.render(
		<article>
			<h1>DurableObject {name}</h1>
			<hr />
			<p>{description}</p>

			<CodePreview open source={source} />
		</article>,
	);
});

app.get("/middleware/:name", async (c, next) => {
	const name = c.req.param("name");

	let source = "";
	let description: string | Promise<HtmlEscapedString> = "";
	switch (name) {
		case "authentication":
			source = authenticationSource;
			description = (
				<>
					Authentication Middleware used protecting routes based on signed
					cookies. An example of how to use this middleware can be found at{" "}
					<a href="/authentication">/authentication</a>.
				</>
			);
			break;
	}

	if (!source) {
		return next();
	}

	return c.render(
		<article>
			<h1>Middleware {name}</h1>
			<hr />
			<p>{description}</p>

			<CodePreview open source={source} />
		</article>,
	);
});
