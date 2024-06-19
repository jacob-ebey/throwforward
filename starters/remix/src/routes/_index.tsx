import { useLoaderData } from "@remix-run/react";

export function loader() {
	return "Hello, World!";
}

export default function Home() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<main>
			<h1>{loaderData}</h1>
		</main>
	);
}
