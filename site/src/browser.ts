import "./browser-globals.ts";
import "../node_modules/htmx-ext-response-targets/response-targets.js";
import "../node_modules/htmx-ext-ws/ws.js";

import "./extensions/helpers.ts";
import "./extensions/aria-disabled.ts";
import "./extensions/markdown.ts";
import "./extensions/sortable.ts";

document.body.addEventListener("htmx:beforeSwap", (e) => {
	const event = e as CustomEvent;
	if (
		event.detail.boosted &&
		event.detail.xhr.status === 404 &&
		event.detail.requestConfig.verb.toLowerCase() === "get"
	) {
		event.detail.shouldSwap = true;
		event.detail.isError = false;
	}
});

document.addEventListener("click", (event) => {
	const button = event.target as HTMLButtonElement;
	if (!button || button.tagName !== "BUTTON") return;
	const copyCodeSelector = button.getAttribute("data-copy-code");
	if (!copyCodeSelector) return;
	const toCopy = querySelectorAllExt(button, copyCodeSelector)[0];
	if (!toCopy || !("textContent" in toCopy) || !toCopy.textContent) return;

	navigator.clipboard.writeText(toCopy.textContent).then(() => {
		// Set the button text to "Copied!" for 2 seconds
		const ogText = button.textContent;
		if (ogText === "Copied!") return;
		button.textContent = "Copied!";
		setTimeout(() => {
			button.textContent = ogText;
		}, 2000);
	});
});
