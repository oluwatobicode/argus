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
export function argus(options) {
    return {
        name: "@argusdev/sdk-astro",
        hooks: {
            "astro:config:setup": ({ injectScript, addMiddleware, updateConfig }) => {
                /* browser capture on every page */
                injectScript("page", `import { init } from "@argusdev/sdk-astro/client";\ninit(${JSON.stringify(options)});`);
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
//# sourceMappingURL=index.js.map