export function createRequire() {
	return () => {
		throw new Error("dynamic require is not supported in Workerd");
	};
}
