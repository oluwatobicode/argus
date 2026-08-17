import { init, captureException } from "./server-capture.js";
const config = typeof __ARGUS_ASTRO_CONFIG__ !== "undefined" ? __ARGUS_ASTRO_CONFIG__ : undefined;
if (config?.dsn) {
    init(config);
}
/*
 * The server hook. SSR errors (frontmatter, endpoints, server islands) reach
 * Astro's own error handling and render the error page — they never surface
 * to process-level handlers. Wrapping next() is the only place to see them.
 *
 * Added automatically by the integration (`addMiddleware`, order: "pre") —
 * you never import this file yourself.
 *
 * The error is rethrown untouched: Astro still renders its error page, dev
 * overlay included. We observe, never absorb.
 */
export const onRequest = async (context, next) => {
    try {
        return await next();
    }
    catch (err) {
        try {
            const tags = {};
            if (context.routePattern)
                tags.routePattern = context.routePattern;
            const rawUserAgent = context.request?.headers?.get?.("user-agent");
            const userAgent = rawUserAgent ?? undefined;
            void captureException(err, {
                tags,
                request: {
                    url: context.url?.pathname,
                    method: context.request?.method,
                    /* cookies/authorization live in the same headers — never forwarded */
                    ...(userAgent ? { headers: { "user-agent": userAgent } } : {}),
                },
            });
        }
        catch {
            /* context reading must never mask the real error */
        }
        throw err;
    }
};
//# sourceMappingURL=middleware.js.map