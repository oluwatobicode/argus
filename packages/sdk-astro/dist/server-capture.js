import { parseDsn, getIngestUrl, buildEnvelope, sendEnvelope, } from "@argusdev/sdk-core";
import { parseStack } from "./stacktrace.js";
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
    const envelope = buildEnvelope(error.name, error.message, frames, {
        environment: client.environment,
        release: client.release,
        ...extra,
    });
    await sendEnvelope(client.url, client.publicKey, envelope);
}
//# sourceMappingURL=server-capture.js.map