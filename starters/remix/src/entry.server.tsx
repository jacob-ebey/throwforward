import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export const streamTimeout = 5000;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	let status = responseStatusCode;
	let shellSent = false;
	const body = await renderToReadableStream(
		<RemixServer context={remixContext} url={request.url} />,
		{
			signal: request.signal,
			onError(error: unknown) {
				if (!shellSent) return;
				console.error(error);
				status = 500;
			},
		},
	);
	shellSent = true;

	if (isbot(request.headers.get("user-agent") || "")) {
		await body.allReady;
	}

	const headers = new Headers(responseHeaders);
	headers.set("Content-Type", "text/html");
	return new Response(body, {
		headers,
		status,
	});
}
