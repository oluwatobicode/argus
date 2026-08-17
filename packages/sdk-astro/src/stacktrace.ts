import type { StackFrame } from "@argusdev/sdk-core";

/*
 * V8 only — Astro's server runs on Node or an edge runtime, both V8.
 * Deliberately NOT imported from sdk-browser: the middleware must not drag
 * browser code into a server or edge bundle.
 */
const FRAME_REGEX = /^at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/;

export function parseStack(stack: string | undefined): StackFrame[] {
  if (!stack) return [];

  const frames = stack.split("\n").map((line): StackFrame | null => {
    const match = line.trim().match(FRAME_REGEX);
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
