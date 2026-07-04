/* V8 stack lines come in two shapes:
 *   at inner (/app/src/service.ts:42:17)   ← named
 *   at /app/src/index.ts:7:3               ← anonymous
 * One regex covers both: the "name (" part is optional.
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