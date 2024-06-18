// sortablejs@1.15.2

htmx.onLoad(async (content: Element) => {
	const sortables = content.querySelectorAll(".sortable");
	let Sortable: any;
	if (sortables.length > 0) {
		Sortable = (await import("sortablejs")).default;
	}
	for (let i = 0; i < sortables.length; i++) {
		const sortable = sortables[i];
		const group = sortable.getAttribute("data-sortable-group");
		const sortableInstance = new Sortable(sortable, {
			group: {
				name: group,
				put: true,
			},
			filter: ".no-drag",
			animation: 150,
			emptyInsertThreshold: 30,
		});
	}
});
