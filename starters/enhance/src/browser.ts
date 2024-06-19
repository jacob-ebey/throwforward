// @ts-expect-error - no types yet
import htmxMod from "htmx.org/dist/htmx.esm.js";

declare global {
	// @ts-expect-error - no types yet
	var htmx: typeof import("htmx.org");
}

window.htmx = htmxMod;
