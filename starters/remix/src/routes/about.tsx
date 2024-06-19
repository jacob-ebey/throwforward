import { useLoaderData } from "@remix-run/react";

export function loader() {
	return "About Page!";
}

export default function About() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<main>
			<h1>{loaderData}</h1>
		</main>
	);
}
