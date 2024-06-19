---
title: Manual Setup
description: A guide to setting up a new project from scratch.
---

# Manual Setup

---

The Throwforward Vite plugin is a powerful tool for building and deploying modern web applications on the Cloudflare platform. This documentation provides an overview of how to use the Throwforward Vite plugin in your Vite configuration.

## `throwforward-dev/vite`

```ts
import throwforward, { pages } from "throwforward-dev/vite";
```

### Throwforward Plugin

This plugin does a few things:

- Configures a development server that uses Workerd as the runtime.
- Configures module resolution for Workerd environments.
- Configures Durable Objects for development.

To use the Throwforward Vite plugin, you need to import it in your Vite configuration file:

#### Options

The Throwforward Vite plugin accepts the following options:

- **environments**: An array of environment names that the plugin should operate on. For example, `["ssr", "durable_objects"]`.
- **serverEntry**: The entry point for your worker entry to use for development.
- **wranglerConfig**: The path to your Wrangler configuration file. Defaults to `wrangler.dev.toml`.
- **durableObjects**: An object that defines durable objects and their corresponding environments for development.

#### Example

Here's an example of how to configure the Throwforward Vite plugin

```ts
throwforward({
  environments: ["ssr", "durable_objects"],
  serverEntry: "src/server.tsx",
  wranglerConfig: "wrangler.dev.toml",
  durableObjects: {
    RATE_LIMITER: {
      environment: "durable_objects",
      file: "/src/durable-objects/rate-limiter.ts",
    },
  },
});
```

### Pages Plugin

This plugin configures the production build for deployment to Cloudflare Pages.

#### Options

The Pages plugin accepts the following options:

- **entry**: The entry point of your worker module.
- **environment**: The server environment to configure the build for. Defaults to `ssr`.
- **outDir**: The output directory for the production build. Defaults to `dist`.

#### Example

Here's an example of how to configure the Pages plugin:

```ts
pages({
  entry: "src/server.tsx",
  environment: "ssr",
  outDir: "dist/pages",
});
```

## Manual Setup

Create a new project directory and initialize a new Node.js project:

```sh
mkdir my-project
cd my-project
npm init -y
```

Install the required dependencies:

```sh
npm i -D -E @cloudflare/workers-types @types/node throwforward-dev typescript vite@6.0.0-alpha.18 wrangler
```

Add your `build` and `dev` scripts to your package.json, as well as `type: "module"`. Delete the `main` field if it exists.

```json
{
  "type": "module",
  "scripts": {
    "build": "vite build --app && tsc",
    "dev": "vite dev"
  }
}
```

Add a `tsconfig.json` to the root of your project:

```json
{
  "include": ["vite.config.ts", "src/**/*"],
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": [
      "@cloudflare/workers-types",
      "node",
      "throwforward-dev/vite-types",
      "vite/client"
    ],
    "strict": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

Add a `wrangler.toml` to the root of your project:

```toml
compatibility_date = "2024-05-28"
```

Add the pages configuration to the public directory:

`public/_headers`

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

`public/_routes.json`

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]
}
```

Add a `vite.config.ts` to the root of your project:

```ts
import throwforward, { pages } from "throwforward-dev/vite";
import { defineConfig } from "vite";

const serverEntry = "src/server.ts";

export default defineConfig({
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: "src/client.ts",
        },
      },
    },
    ssr: {},
  },
  plugins: [
    pages({ entry: serverEntry }),
    throwforward({
      environments: ["ssr"],
      serverEntry,
    }),
  ],
});
```

Add a `src/client.ts` file that will act as the entry point for your client-side code:

```ts
console.log("Hello, client!");
```

Add a `src/server.ts` file that will act as the entry point for your server-side code:

```ts
import clientEntry from "bridge:./client.js";

export default {
  fetch() {
    return new Response(
      `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Throwforward</title>
          </head>
          <body>
            <h1>Hello, world!</h1>
            <script type="module" src="${clientEntry}"></script>
          </body>
        </html>
      `.trim(),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  },
} satisfies ExportedHandler;
```

The `bridge:./client.js` import is a special import that allows you to import the client-side entry point in your server-side code as a pathname string.

You should now be able to run `npm run dev` to start the development server and `npm run build` to build your project for production.

To deploy your project to Cloudflare Pages, you can use the following command:

```sh
npx wrangler pages deploy dist
```

### File Structure

You should end up with the following file structure:

```
my-project/
├── public/
│   ├── _headers
│   └── _routes.json
├── src/
│   ├── client.ts
│   └── server.ts
|── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```
