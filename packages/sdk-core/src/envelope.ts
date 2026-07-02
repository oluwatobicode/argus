import type { Envelope, StackFrame } from "./types";

/* everything optional a captured error can carry along */
export interface EnvelopeOptions {
  level?: Envelope["level"];
  environment?: string;
  release?: string;
  user?: Envelope["user"];
  tags?: Envelope["tags"];
  breadcrumbs?: Envelope["breadcrumbs"];
  contexts?: Envelope["contexts"];
  request?: Envelope["request"];
}

/*
 * Pure function: raw error parts in → validator-shaped Envelope out.
 * No fetch, no globals — the same code runs in node, browser, RN.
 */
export function buildEnvelope(
  type: string,
  value: string,
  frames: StackFrame[],
  options: EnvelopeOptions = {},
): Envelope {
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
