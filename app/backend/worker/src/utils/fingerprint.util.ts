import crypto from "crypto";
import type { StackFrame } from "../types";

const MAX_FRAMES = 5;

export function computeFingerprint(frames: StackFrame[]): string {
  const top = frames.slice(0, MAX_FRAMES);
  const raw = top
    .map((f) => `${f.filename}:${f.function ?? "?"}:${f.lineno}`)
    .join("|");

  return crypto.createHash("sha256").update(raw).digest("hex");
}
