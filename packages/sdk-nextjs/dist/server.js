import { parseDsn, getIngestUrl, buildEnvelope, sendEnvelope, } from "@argusdev/sdk-core";
import { parseStack } from "./stacktrace.js";
/* set once by init(); null means "not initialized — do nothing, never crash" */
let client = null;
/*
 * Call from `register()` in instrumentation.ts. No process hooks here, unlike
 * sdk-node: Next catches request errors and renders its error page, so they
 * never surface as uncaughtException — onRequestError below is the real hook.
 * (Also: `process` doesn't exist on the edge runtime.)
 */
export function init(options) {
    const parsed = parseDsn(options.dsn); /* throws on bad DSN — loudly, at startup */
    client = {
        url: getIngestUrl(parsed),
        publicKey: parsed.publicKey,
        environment: options.environment,
        release: options.release,
    };
}
async function maybeAttachSourceContext(frames) {
    try {
        const isNode = process.env.NEXT_RUNTIME === "nodejs" ||
            (process.env.NEXT_RUNTIME === undefined &&
                typeof process.versions?.node === "string");
        if (isNode) {
            const { attachSourceContext } = await import("@argusdev/sdk-node");
            attachSourceContext(frames);
        }
    }
    catch {
        /* no context is fine — never let it break error reporting */
    }
}
export async function captureException(err, extra = {}) {
    if (!client)
        return; /* init() not called — silently no-op */
    const error = err instanceof Error ? err : new Error(String(err));
    let frames = parseStack(error.stack);
    if (frames.length === 0) {
        /* validator requires >= 1 frame — synthesize one rather than drop the event */
        frames = [{ filename: "<unknown>", lineno: 1 }];
    }
    /* ±5 source lines per in-app frame — Node runtime only, see above */
    await maybeAttachSourceContext(frames);
    const envelope = buildEnvelope(error.name, error.message, frames, {
        environment: client.environment,
        release: client.release,
        ...extra,
    });
    await sendEnvelope(client.url, client.publicKey, envelope);
}
/*
 * The server hook. One export covers server components, route handlers,
 * server actions, and middleware:
 *
 *   // instrumentation.ts
 *   import { init, onRequestError as argusOnRequestError } from "@argusdev/sdk-nextjs/server";
 *
 *   export function register() {
 *     init({ dsn: process.env.ARGUS_DSN! });
 *   }
 *   export const onRequestError = argusOnRequestError;
 *
 * Returns a promise and Next awaits it — that matters on serverless, where the
 * function can freeze the moment the response is sent and drop an in-flight
 * request.
 */
export async function onRequestError(error, request = {}, context = {}) {
    const tags = {};
    if (context.routerKind)
        tags.routerKind = context.routerKind;
    if (context.routeType)
        tags.routeType = context.routeType;
    if (context.renderSource)
        tags.renderSource = context.renderSource;
    if (context.revalidateReason)
        tags.revalidateReason = context.revalidateReason;
    /* routePath is the dynamic PATTERN ("/blog/[slug]"), so it stays stable
       across requests — the one tag worth filtering the dashboard by */
    if (context.routePath)
        tags.routePath = context.routePath;
    /* Next stamps a digest on server errors and surfaces the SAME digest to the
       client's error.tsx — carrying it on both sides joins the two halves of one
       failure into a searchable pair */
    const digest = error?.digest;
    if (typeof digest === "string" && digest)
        tags.digest = digest;
    const rawUserAgent = request.headers?.["user-agent"];
    const userAgent = Array.isArray(rawUserAgent)
        ? rawUserAgent[0]
        : rawUserAgent;
    await captureException(error, {
        tags,
        request: {
            url: request.path,
            method: request.method,
            /* headers are NOT forwarded wholesale on purpose — cookies and
               authorization live in there. user-agent is the one worth having. */
            ...(userAgent ? { headers: { "user-agent": userAgent } } : {}),
        },
    });
}
//# sourceMappingURL=server.js.map