/*
 * Pure function: raw error parts in → validator-shaped Envelope out.
 * No fetch, no globals — the same code runs in node, browser, RN.
 */
export function buildEnvelope(type, value, frames, options = {}) {
    return {
        ...options,
        level: options.level ?? "error",
        timestamp: Date.now() /* ms since epoch — the contract */,
        exception: {
            type,
            value,
            stacktrace: { frames },
        },
    };
}
//# sourceMappingURL=envelope.js.map