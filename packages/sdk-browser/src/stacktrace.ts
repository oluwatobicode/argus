import type { StackFrame } from "@argusdev/sdk-core";

/* Chrome/Edge (V8):        at fn (https://site.com/app.js:42:17)
 *                          at https://site.com/app.js:7:3
 * Firefox/Safari (JSC):    fn@https://site.com/app.js:42:17
 *                          @https://site.com/app.js:7:3
 */
const CHROME_REGEX = /^at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;
const FIREFOX_REGEX = /^(?:(.*?)@)?(.+?):(\d+):(\d+)$/;

export function parseStack(stack: string | undefined): StackFrame[] {
  if (!stack) return [];

  const frames = stack.split("\n").map((rawLine): StackFrame | null => {
    const line = rawLine.trim();
    if (!line) return null;

    const match =
      line.startsWith("at ") ? line.match(CHROME_REGEX) : line.match(FIREFOX_REGEX);
    if (!match) return null;

    const frame: StackFrame = {
      filename: match[2]!,
      lineno: Number(match[3]),
      colno: Number(match[4]),
    };
    if (match[1]) {
      frame.function = match[1];
    }
    return frame;
  });

  return frames.filter((frame): frame is StackFrame => frame !== null);
}
