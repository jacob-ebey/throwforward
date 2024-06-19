htmx.defineExtension("aria-disabled", {
	// TODO: These types shouldn't be needed once HTMX publishes dist/htmx.d.ts
	// https://github.com/bigskysoftware/htmx/issues/2629
	onEvent(name: string, event: CustomEvent) {
		switch (name) {
			case "htmx:beforeRequest": {
				const target = event.target as HTMLElement;
				if (!target?.getAttribute) return;
				const attrTarget = target.getAttribute("hx-aria-disabled");
				if (!attrTarget) return;

				const internalData = getInternalData(target);
				const disabledCount = (internalData.disabledCount =
					(internalData.disabledCount || 0) + 1);
				internalData.disabled = internalData.disabled ?? new Set();

				if (attrTarget === "this") {
					internalData.disabled.add(target);
				} else {
					const result = querySelectorAllExt(target, attrTarget);
					if (result.length === 0) {
						console.error(
							`The selector "${attrTarget}" on hx-aria-disabled returned no matches!`,
						);
					} else {
						for (const r of result) {
							internalData.disabled.add(r);
						}
					}
				}

				for (const elt of internalData.disabled) {
					if (elt) {
						elt.setAttribute("aria-disabled", "true");
					}
				}

				event.detail.xhr.addEventListener("loadend", () => {
					if (disabledCount === internalData.disabledCount) {
						for (const elt of internalData.disabled) {
							if (elt) {
								elt.removeAttribute("aria-disabled");
							}
						}
					}
				});
				break;
			}
		}
	},
});
