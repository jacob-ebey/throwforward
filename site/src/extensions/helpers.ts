declare global {
	function getInternalData(elt: any): any;

	function querySelectorAllExt(
		elt: HTMLElement,
		selector: string,
	): (Window | Document | Element | null | undefined)[] | NodeListOf<Element>;
}

window.getInternalData = (elt: any) => {
	const dataProp = "htmx-internal-data";
	let data = elt[dataProp];
	if (!data) {
		data = elt[dataProp] = {};
	}
	return data;
};

window.querySelectorAllExt = (
	elt: HTMLElement,
	selector: string,
): (Window | Document | Element | null | undefined)[] | NodeListOf<Element> => {
	if (selector.indexOf("closest ") === 0) {
		return [htmx.closest(elt, normalizeSelector(selector.slice(8)))];
	}
	if (selector.indexOf("find ") === 0) {
		return [htmx.find(elt, normalizeSelector(selector.slice(5)))];
	}
	if (selector === "next") {
		return [elt.nextElementSibling];
	}
	if (selector.indexOf("next ") === 0) {
		return [scanForwardQuery(elt, normalizeSelector(selector.slice(5)))];
	}
	if (selector === "previous") {
		return [elt.previousElementSibling];
	}
	if (selector.indexOf("previous ") === 0) {
		return [scanBackwardsQuery(elt, normalizeSelector(selector.slice(9)))];
	}
	if (selector === "document") {
		return [document];
	}
	if (selector === "window") {
		return [window];
	}
	if (selector === "body") {
		return [document.body];
	}
	return document.querySelectorAll(normalizeSelector(selector));
};

function normalizeSelector(selector: string) {
	const trimmedSelector = selector.trim();
	if (trimmedSelector.startsWith("<") && trimmedSelector.endsWith("/>")) {
		return trimmedSelector.substring(1, trimmedSelector.length - 2);
	}
	return trimmedSelector;
}

function scanForwardQuery(start: HTMLElement, match: string) {
	const results = document.querySelectorAll(match);
	for (let i = 0; i < results.length; i++) {
		const elt = results[i];
		if (
			elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING
		) {
			return elt;
		}
	}
}

function scanBackwardsQuery(start: HTMLElement, match: string) {
	const results = document.querySelectorAll(match);
	for (let i = results.length - 1; i >= 0; i--) {
		const elt = results[i];
		if (
			elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING
		) {
			return elt;
		}
	}
}
