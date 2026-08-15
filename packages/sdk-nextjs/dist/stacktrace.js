/*
 * V8 only — Next's server code runs on Node or the edge runtime, both V8, so
 * there's no Firefox/JSC format to worry about here.
 *
 *   at handler (/app/.next/server/app/api/users/route.js:42:17)   ← named
 *   at /app/.next/server/app/page.js:7:3                          ← anonymous
 *
 * Deliberately NOT imported from sdk-browser: the server entry must not drag
 * browser code into a server or edge bundle.
 */
const FRAME_REGEX = /^at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/;
export function parseStack(stack) {
    if (!stack)
        return [];
    const frames = stack.split("\n").map((line) => {
        const match = line.trim().match(FRAME_REGEX);
        if (!match)
            return null;
        const frame = {
            filename: match[2],
            lineno: Number(match[3]),
            colno: Number(match[4]),
        };
        if (match[1]) {
            frame.function = match[1];
        }
        return frame;
    });
    return frames.filter((frame) => frame !== null);
}
//# sourceMappingURL=stacktrace.js.map