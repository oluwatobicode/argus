import { parseDsn, getIngestUrl, buildEnvelope, sendEnvelope, } from "@argusdev/sdk-core";
import { parseStack } from "./stacktrace.js";
import { startVitals } from "./vitals.js";
/* set once by init(); null means "not initialized — do nothing, never crash" */
let client = null;
export function init(options) {
    const parsed = parseDsn(options.dsn); /* throws on bad DSN — loudly, at startup */
    client = {
        url: getIngestUrl(parsed),
        publicKey: parsed.publicKey,
        environment: options.environment,
        release: options.release,
    };
    /*
     * SSR — Next.js, Nuxt, Angular Universal, Remix. There is no DOM to hook
     * here, and the same module graph runs on both sides, so init() WILL be
     * called on the server. Bail before touching window rather than taking down
     * someone's server render: the golden rule matters most when we're inside
     * their request path. `client` stays set on purpose, so a manual
     * captureException() still reports from the server — Node's stack format is
     * V8, which parseStack already handles.
     */
    if (typeof window === "undefined")
        return;
    /* web vitals + page.load transaction (opt out with vitals: false) */
    if (options.vitals !== false) {
        startVitals(client.url, client.publicKey);
    }
    /* chain any handler the app already installed — we observe, never replace */
    const previousOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        if (error) {
            void captureException(error);
        }
        else {
            /* no Error object (e.g. cross-origin scripts) — build a frame from the args */
            const frame = {
                filename: source || "<unknown>",
                lineno: lineno || 1,
            };
            if (colno)
                frame.colno = colno;
            void send("Error", String(message), [frame], {});
        }
        if (previousOnError) {
            return previousOnError.call(window, message, source, lineno, colno, error);
        }
        return false; /* don't suppress the console error — devs still want to see it */
    };
    window.addEventListener("unhandledrejection", (event) => {
        void captureException(event.reason);
    });
}
export async function captureException(err, extra = {}) {
    /* people reject(non-Error) all the time — normalize */
    const error = err instanceof Error ? err : new Error(String(err));
    let frames = parseStack(error.stack);
    if (frames.length === 0) {
        /* validator requires >= 1 frame — synthesize one rather than drop the event */
        frames = [{ filename: "<unknown>", lineno: 1 }];
    }
    await send(error.name, error.message, frames, extra);
}
async function send(type, value, frames, extra) {
    if (!client)
        return; /* init() not called — silently no-op */
    const envelope = buildEnvelope(type, value, frames, {
        environment: client.environment,
        release: client.release,
        /* page URL only exists client-side; on the server the caller supplies
           request context through `extra` (see @argusdev/sdk-nextjs/server) */
        ...(typeof window !== "undefined"
            ? { request: { url: window.location.href } }
            : {}),
        ...extra,
    });
    await sendEnvelope(client.url, client.publicKey, envelope);
}
//# sourceMappingURL=init.js.map