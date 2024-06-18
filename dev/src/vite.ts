import * as fsp from "node:fs/promises";
import * as path from "node:path";

import { getRequestListener } from "@hono/node-server";

import type {
	CloudflareVitePluginOptions,
	WorkerdDevEnvironment,
} from "@jacob-ebey/cf-vite-plugin";
import cloudflare from "@jacob-ebey/cf-vite-plugin";
import type { PluginOption, Rollup } from "vite";
import { defineConfig } from "vite";
import ws from "ws";

declare global {
	var clientBuildPromise:
		| Promise<
				Rollup.RollupOutput | Rollup.RollupOutput[] | Rollup.RollupWatcher
		  >
		| undefined;
}

global.clientBuildPromise = global.clientBuildPromise || undefined;

export type ThrowforwardOptions = {
	/**
	 * The environments to apply this plugin to.
	 */
	environments: string[];
	/**
	 * The path to your server entry to use for development.
	 */
	serverEntry: string;
	durableObjects?: CloudflareVitePluginOptions["durableObjects"];
	/**
	 * The path to the wrangler.toml file to use for development.
	 * @default "./wrangler.dev.toml"
	 */
	wranglerConfig?: string;
};

export default function throwforward({
	environments,
	serverEntry,
	durableObjects,
	wranglerConfig,
}: ThrowforwardOptions): PluginOption {
	return [
		cloudflare({
			environments,
			persist: true,
			wrangler: {
				configPath: wranglerConfig,
			},
			durableObjects,
		}),
		{
			name: "throw-forward",
			config() {
				return {
					builder: {
						async buildApp(builder) {
							clientBuildPromise = builder.build(builder.environments.client);
							await Promise.all(
								environments.map((env) =>
									builder.build(builder.environments[env]),
								),
							);
							await clientBuildPromise;
						},
					},
					environments: {
						client: {
							build: {
								manifest: true,
							},
						},
					},
				};
			},
		},
		{
			name: "throw-forward-dev-server",
			async configureServer(server) {
				const devEnv = server.environments[
					environments[0]
				] as WorkerdDevEnvironment;

				const wss = new ws.Server({ noServer: true });
				server.httpServer!.on("upgrade", (request, socket, head) => {
					const url = request.originalUrl ?? request.url ?? "/";
					if (url.length > 1) {
						wss.handleUpgrade(request, socket, head, async (ws: any) => {
							const headers = new Headers();
							for (const [key, value] of Object.entries(request.headers)) {
								if (typeof value === "string") {
									headers.append(key, value);
								} else if (Array.isArray(value)) {
									for (const v of value) {
										headers.append(key, v);
									}
								}
							}
							headers.set(
								"x-vite-fetch",
								JSON.stringify({ entry: serverEntry }),
							);
							const response = await devEnv.api.runnerObject.fetch(
								`http://localhost:5173${url}`,
								{
									headers: headers as any,
								},
							);
							const { webSocket } = response;
							if (!webSocket) {
								socket.destroy();
								return;
							}
							webSocket.accept();
							webSocket.addEventListener("message", (event) => {
								ws.send(event.data);
							});
							ws.on("message", (data: any) => {
								webSocket.send(data);
							});

							webSocket.addEventListener("close", () => {
								socket.destroy();
							});

							wss.emit("connection", ws, request);
						});
					}
				});

				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							const listener = getRequestListener(async (c) => {
								const res = await devEnv.api.dispatchFetch(serverEntry, c);
								// This doesn't forward headers correctly unless
								// we unwrap the response and rewrap it.
								return new Response(res.body, {
									status: res.status,
									statusText: res.statusText,
									headers: res.headers,
									duplex: res.body ? "half" : undefined,
								} as ResponseInit);
							});
							req.url = req.originalUrl;
							await listener(req, res);
						} catch (reason) {
							next(reason);
						}
					});
				};
			},
		},
		{
			name: "bridged-assets",
			async resolveId(id, importer) {
				if (id.startsWith("bridge:")) {
					if (!this.environment?.config.ssr) {
						throw new Error("Cannot bridge assets from a client build.");
					}

					const baseId = id.slice("bridge:".length);
					const postfix = this.environment.config.command !== "build" ? "" : "";
					const resolved = await this.resolve(baseId + postfix, importer, {
						skipSelf: true,
					});
					if (!resolved) {
						throw new Error(`Could not resolve asset: ${baseId}`);
					}

					// The # is to stop vite from trying to transform the asset.
					return `\0bridge:${resolved.id}#`;
				}
			},
			async load(id) {
				if (id.startsWith("\0bridge:") && id.endsWith("#")) {
					if (!this.environment?.config.ssr) {
						throw new Error("Cannot bridge assets from a client build.");
					}
					const baseId = id.slice("\0bridge:".length, -1);
					const relative = path
						.relative(this.environment.config.root, baseId)
						.replace(/\\/g, "/");

					if (this.environment.config.command !== "build") {
						return `export default "/${relative}";`;
					}

					if (!clientBuildPromise) {
						throw new Error("Client build promise not set.");
					}
					const clientBuildResults = await clientBuildPromise;
					const clientBuild = clientBuildResults as Rollup.RollupOutput;

					const manifest = clientBuild.output.find(
						(o) => o.fileName === ".vite/manifest.json",
					);
					if (
						!manifest ||
						!("source" in manifest) ||
						typeof manifest.source !== "string"
					) {
						throw new Error("Could not find client manifest.");
					}
					const manifestJson = JSON.parse(manifest.source);
					let manifestFile = manifestJson[relative]?.file as string | undefined;
					manifestFile =
						manifestFile ??
						(manifestJson[`${relative}?commonjs-entry`]?.file as
							| string
							| undefined);

					if (!manifestFile) {
						const output = clientBuild.output.find(
							(o) => "facadeModuleId" in o && o.facadeModuleId === baseId,
						);
						if (!output) {
							throw new Error(`Could not find browser output for ${baseId}`);
						}
						manifestFile = output.fileName;
					}

					return `export default "${this.environment.config.base}${manifestFile}";`;
				}
			},
		},
	];
}
