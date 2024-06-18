import Groq from "groq-sdk";
import type { Context } from "hono";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";

import { CodePreview } from "../components/code-preview.js";
import { createDurableClient } from "../durable-object-client.js";
import type { RateLimiterAPI } from "../durable-objects/rate-limiter.js";
import type {
	AuthEnvironment,
	AuthVariables,
} from "../middleware/authentication.js";
import { authenticationMiddleware } from "../middleware/authentication.js";

import { z } from "zod";
import source from "./llm.js?raw";

type Env = {
	Bindings: AuthEnvironment & {
		GROQ_API_KEY: string;
		RATE_LIMITER: DurableObjectNamespace;
	};
	Variables: AuthVariables;
};

export const app = new Hono<Env>().use(authenticationMiddleware);

app.get(
	"/llm/socket/chat",
	async (c, next) => {
		if (!c.get("userId")) {
			return c.redirect("/authentication?redirect=/llm");
		}
		return next();
	},
	upgradeWebSocket((c: Context<Env>) => ({
		async onMessage(event, ws) {
			const nextId = (
				<input
					id="chat-form-id"
					hx-swap-oob="outerHTML"
					type="hidden"
					name="id"
					value={nextMessageId()}
				/>
			);

			const userId = c.get("userId");
			if (!userId) {
				ws.send(
					(
						<>
							{nextId}
							<div id="messages" hx-swap-oob="beforeend">
								<p>
									<strong>Error:</strong> Unauthorized
								</p>
							</div>
						</>
					).toString(),
				);
				ws.close(1008, "Unauthorized");
				return;
			}

			const parsed = z
				.object({
					id: z.string().min(1),
					message: z.string(),
				})
				.safeParse(
					JSON.parse(
						typeof event.data === "string"
							? event.data
							: new TextDecoder().decode(event.data as ArrayBufferLike),
					),
				);

			if (!parsed.success) {
				ws.send(
					(
						<>
							{nextId}
							<div id="messages" hx-swap-oob="beforeend">
								<p>
									<strong>Error:</strong> Invalid request
								</p>
							</div>
						</>
					).toString(),
				);
				return;
			}

			let { id, message } = parsed.data;
			message = message.trim();

			if (!message) {
				return;
			}

			const rateLimiter = createDurableClient<RateLimiterAPI>(
				c.env.RATE_LIMITER.get(c.env.RATE_LIMITER.idFromName(`chat-${userId}`)),
			);

			const next = await rateLimiter.next
				.$get({
					query: { msForGracePeriod: "5000", msPerRequest: "5000" },
				})
				.then((res) => res.json());

			if (typeof next !== "number" || next > 0) {
				const retryId = nextMessageId();

				ws.send(
					(
						<>
							{nextId}
							<div id={id} hx-swap-oob="outerHTML">
								<strong>Error:</strong>{" "}
								<span data-msg>
									Rate limit exceeded. Please wait{" "}
									<span data-time>{Math.ceil((next + 1000) / 1000)}</span>{" "}
									seconds.
								</span>{" "}
								<form ws-send="" style="display: inline-block;" no-create>
									<input type="hidden" name="id" value={retryId} />
									<input type="hidden" name="message" value={message} />
									<button type="submit" disabled>
										Retry
									</button>
								</form>
								<script
									dangerouslySetInnerHTML={{
										__html: `
                      (() => {
                        const err = document.getElementById("${id}");
                        const msg = err.querySelector("span[data-msg]");
                        const time = err.querySelector("span[data-time]");
                        const btn = err.querySelector("button[disabled]");
                        const interval = setInterval(() => {
                          time.textContent = Math.max(0, parseInt(time.textContent) - 1);
                        }, 1000);
                        setTimeout(() => {
                          clearInterval(interval);
                          msg.textContent = "Rate limit exceeded.";
                          btn.disabled = false;
                          btn.addEventListener("click", () => {
                            document.getElementById("user-"+ "${id}").id = "user-${retryId}";
                            err.id = "${retryId}";
                            document.getElementById("chat-form-id").value = "${retryId}";
                          }, { once: true });
                        }, ${next});
                      })();
                    `,
									}}
								/>
							</div>
						</>
					).toString(),
				);

				return;
			}

			const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });

			try {
				const stream = await groq.chat.completions.create({
					stream: true,
					model: "llama3-8b-8192",
					user: userId,
					messages: [
						{
							role: "user",
							content: message,
						},
					],
				});

				ws.send(
					(
						<div id={id} hx-swap-oob="outerHTML">
							<strong>Assistant:</strong>
							<div id={`${id}-message`} hidden />
							<div data-markdown={`#${id}-message`} />
						</div>
					).toString(),
				);
				for await (const chunk of stream) {
					const content = chunk.choices[0].delta.content;
					if (content) {
						ws.send(
							(
								<div id={`${id}-message`} hx-swap-oob="beforeend">
									{content}
								</div>
							).toString(),
						);
					}
				}
				ws.send(nextId.toString());
			} catch (error) {
				ws.send(
					(
						<>
							{nextId}
							<div id={id} hx-swap-oob="outerHTML">
								<strong>Assistant:</strong> Sorry, I'm having trouble right now.
							</div>
						</>
					).toString(),
				);
			}
		},
	})),
);

app.get("/llm", (c) => {
	if (!c.get("userId")) {
		return c.redirect("/authentication?redirect=/llm");
	}

	const id = nextMessageId();

	return c.render(
		<article>
			<h1>LLM's / Streaming</h1>
			<hr />
			<p>
				Sometimes you need to stream data from the server to the client. This is
				a common pattern for things like chat messages, live sports scores, and
				more. In this example, we'll show how to use htmx to stream chat
				responses, as well as use the{" "}
				<a href="/durable-object/rate-limiter">rate limiter durable object</a>{" "}
				to prevent abuse.
			</p>
			<blockquote>
				<strong>Note:</strong> This example only works with JavaScript enabled.
			</blockquote>

			<br />

			<div hx-ext="ws" ws-connect="/llm/socket/chat" class="window">
				<div class="title-bar">
					<div class="title-bar-text">LLM example</div>
				</div>
				<div class="window-body has-space">
					<form
						id="chat-form"
						ws-send=""
						hx-indicator="closest form"
						hx-aria-disabled="button[type=submit]"
						hx-swap="transition:false"
						style="margin-bottom: 12px;"
					>
						<input id="chat-form-id" type="hidden" name="id" value={id} />

						<div class="searchbox" style="display: block;">
							<input
								id="chat-form-message"
								required
								name="message"
								type="search"
								placeholder="Ask a question"
								style="width: 100%;"
								disabled
							/>
							<button aria-label="search" type="submit" disabled />
						</div>
					</form>
					<div id="messages" />
					<template id="sent-message">
						<div>
							<strong>User:</strong> <p />
						</div>
					</template>
					<template id="pending-message">
						<div>
							<strong>Assistant:</strong>{" "}
							<span
								class="loader animate"
								aria-label="Processing your question..."
							/>
						</div>
					</template>
					<script
						dangerouslySetInnerHTML={{
							__html: `
                (() => {
                  addEventListener("htmx:wsOpen", () => {
                    document.querySelector("input[name=message]").disabled = false;
                    document.querySelector("button[type=submit]").disabled = false;
                  }, { once: true });
                  let lastSentId = "";
                  document.getElementById("chat-form").addEventListener("htmx:wsBeforeSend", (event) => {
                    const elt = event.detail.elt;
                    const id = elt.elements.id.value;
                    if (id === lastSentId) {
                      event.preventDefault();
                      return;
                    }
                    lastSentId = id;
                    if (typeof elt.getAttribute("no-create") === "string") {
                    return;
                    }
                    const message = elt.elements.message.value;
                    elt.reset();
                    let template = document.getElementById("sent-message");
                    let clone = document.importNode(template.content, true);
                    clone.querySelector("p").id = "user-" + id;
                    clone.querySelector("p").appendChild(document.createTextNode(message));
                    document.getElementById("messages").appendChild(clone);
                    template = document.getElementById("pending-message");
                    clone = document.importNode(template.content, true);
                    clone.querySelector("div").id = id;
                    document.getElementById("messages").appendChild(clone);
                  });
                })();
              `,
						}}
					/>
				</div>
			</div>

			<br />

			<CodePreview source={source} />
		</article>,
	);
});

function nextMessageId() {
	return `message-${Date.now() + Math.random().toString(36).substring(7)}`;
}
