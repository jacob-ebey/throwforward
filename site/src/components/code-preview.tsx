import hljs from "highlight.js/lib/core";
import hljsJavascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("jsx", hljsJavascript);

function highlight(source: string) {
	return hljs.highlight(source.trim().replace(/\t/g, "  "), { language: "jsx" })
		.value;
}

export function CodePreview({
	label,
	open,
	source,
}: { label?: string; open?: boolean; source: string }) {
	return (
		<details class="code" open={open}>
			<summary>{label || "Show Code"}</summary>
			<pre class="has-scrollbar">
				<code
					dangerouslySetInnerHTML={{
						__html: highlight(source),
					}}
				/>
			</pre>
			<button type="button" data-copy-code="previous code">
				Copy Code
			</button>
		</details>
	);
}
