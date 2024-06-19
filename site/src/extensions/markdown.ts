htmx.onLoad(async (content: Element) => {
	const markdownTargets = content.querySelectorAll("[data-markdown]");

	let markdown: any;
	if (markdownTargets.length > 0) {
		// @ts-expect-error - no types
		const { default: Markdown } = await import("md2dom");
		markdown = new Markdown();
	}
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
