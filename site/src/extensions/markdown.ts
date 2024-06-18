// @ts-expect-error - no types
import Markdown from "md2dom"; // v24.2.9

import { querySelectorAllExt } from "./helpers.js";

const markdown = new Markdown();

htmx.onLoad(async (content: Element) => {
	const markdownTargets = content.querySelectorAll("[data-markdown]");

	for (const target of markdownTargets) {
		const sourceSelector = target.getAttribute("data-markdown");
		if (!sourceSelector) continue;
		const [source] = querySelectorAllExt(target as HTMLElement, sourceSelector);
		if (!source) continue;

		const observer = new MutationObserver(() => {
			console.log("Markdown updated");
			target.replaceChildren(
				...markdown.parse((source as HTMLElement).textContent),
			);
		});
		observer.observe(source as Element, {
			childList: true,
			subtree: true,
		});
	}
});
