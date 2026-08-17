import { init, captureException, type ServerInitOptions } from "./server-capture.js";

/*
 * The integration (index.ts) injects the config as a compile-time constant
 * via vite `define` — no virtual modules, so this file also loads in plain
 * Node (where the constant simply doesn't exist and the middleware no-ops).
 */
declare const __ARGUS_ASTRO_CONFIG__: ServerInitOptions | undefined;

const config =
  typeof __ARGUS_ASTRO_CONFIG__ !== "undefined" ? __ARGUS_ASTRO_CONFIG__ : undefined;
if (config?.dsn) {
  init(config);
}

/* the slice of Astro's APIContext we read — structural, no astro dependency */
interface ContextLike {
  /* the route PATTERN ("/blog/[slug]") — stable across requests (Astro 5+) */
  routePattern?: string;
  url?: { pathname?: string };
  request?: {
    method?: string;
    headers?: { get(name: string): string | null };
  };
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
export const onRequest = async (
  context: ContextLike,
  next: () => Promise<Response> | Response,
): Promise<Response> => {
  try {
    return await next();
  } catch (err) {
    try {
      const tags: Record<string, string> = {};
      if (context.routePattern) tags.routePattern = context.routePattern;

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
    } catch {
      /* context reading must never mask the real error */
    }
    throw err;
  }
};
