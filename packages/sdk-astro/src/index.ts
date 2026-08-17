/*
 * The Astro integration — one line in astro.config wires both runtimes:
 *
 *   // astro.config.mjs
 *   import { defineConfig } from "astro/config";
 *   import argus from "@argusdev/sdk-astro";
 *
 *   export default defineConfig({
 *     integrations: [argus({ dsn: "https://KEY@host/PROJECT_ID" })],
 *   });
 *
 * What it does at astro:config:setup:
 *   1. injectScript("page", …) — browser init on every page: window.onerror,
 *      unhandled rejections, web vitals.
 *   2. addMiddleware(order: "pre") — SSR error capture around next().
 *   3. vite define — compiles the DSN into the middleware as a constant.
 */

export interface ArgusAstroOptions {
  dsn: string;
  environment?: string;
  release?: string;
  /* page.load transaction with LCP/CLS/FCP/TTFB per page view (default: true) */
  vitals?: boolean;
}

/*
 * Structural slices of Astro's integration API — only the members we use,
 * typed narrowly so Astro's real functions are assignable to them. No astro
 * dependency (the sdk-angular / sdk-nextjs trick, again).
 */
interface SetupHookArgs {
  injectScript(stage: "page", content: string): void;
  addMiddleware(middleware: { entrypoint: string; order: "pre" }): void;
  updateConfig(config: {
    vite?: { define?: Record<string, string> };
  }): unknown;
}

export interface ArgusAstroIntegration {
  name: string;
  hooks: {
    "astro:config:setup": (args: SetupHookArgs) => void;
  };
}

export function argus(options: ArgusAstroOptions): ArgusAstroIntegration {
  return {
    name: "@argusdev/sdk-astro",
    hooks: {
      "astro:config:setup": ({ injectScript, addMiddleware, updateConfig }) => {
        /* browser capture on every page */
        injectScript(
          "page",
          `import { init } from "@argusdev/sdk-astro/client";\ninit(${JSON.stringify(options)});`,
        );

        /* SSR capture around the request pipeline */
        addMiddleware({ entrypoint: "@argusdev/sdk-astro/middleware", order: "pre" });

        /* hand the middleware its config as a compile-time constant */
        updateConfig({
          vite: {
            define: {
              __ARGUS_ASTRO_CONFIG__: JSON.stringify({
                dsn: options.dsn,
                environment: options.environment,
                release: options.release,
              }),
            },
          },
        });
      },
    },
  };
}

export default argus;
