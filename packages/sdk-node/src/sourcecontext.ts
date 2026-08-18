import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { StackFrame } from "@argusdev/sdk-core";

/*
 * Source context: the ±5 lines around each in-app frame, read off disk at
 * capture time and shipped inside the envelope. This is how the dashboard
 * shows the actual broken code, not just a file:line skeleton — on a server,
 * the crashing source is sitting right there, so no source maps are needed.
 *
 * Golden rule applies throughout: a failure to read context must never grow
 * into a failure to report the error. Everything here degrades to "no
 * snippet", silently.
 */

const CONTEXT_LINES = 5;
const MAX_LINE_LENGTH = 200; /* validator allows 300 — headroom for others */
const MAX_FRAMES_WITH_CONTEXT = 10; /* bound the I/O per event */
const MAX_FILE_SIZE = 1_000_000; /* a 1MB+ "source file" is a bundle — skip */

/* one process, one source tree — cache reads across captures */
const fileCache = new Map<string, string[] | null>();
const MAX_CACHED_FILES = 50;

function isAppFrame(filename: string): boolean {
  if (filename.includes("node_modules")) return false;
  if (filename.startsWith("node:")) return false; /* node internals */
  /* ESM stacks use file:// URLs, CJS uses bare paths — both are on disk;
     anything else (webpack://, evalmachine, <anonymous>) is not readable */
  return filename.startsWith("file://") || filename.startsWith("/");
}

function readLines(filename: string): string[] | null {
  const cached = fileCache.get(filename);
  if (cached !== undefined) return cached;

  let lines: string[] | null = null;
  try {
    const path = filename.startsWith("file://")
      ? fileURLToPath(filename)
      : filename;
    if (statSync(path).size <= MAX_FILE_SIZE) {
      lines = readFileSync(path, "utf8").split("\n");
    }
  } catch {
    /* unreadable — deleted, permissions, race — remember that too */
  }

  if (fileCache.size >= MAX_CACHED_FILES) fileCache.clear();
  fileCache.set(filename, lines);
  return lines;
}

const clip = (line: string): string => line.slice(0, MAX_LINE_LENGTH);

/* mutates the frames in place — called between parseStack and buildEnvelope */
export function attachSourceContext(frames: StackFrame[]): void {
  let attached = 0;
  for (const frame of frames) {
    if (attached >= MAX_FRAMES_WITH_CONTEXT) return;
    try {
      if (!isAppFrame(frame.filename)) continue;

      const lines = readLines(frame.filename);
      /* lineno is 1-based; a lineno past EOF means the file on disk no longer
         matches the running code — better no snippet than the wrong snippet */
      if (!lines || frame.lineno < 1 || frame.lineno > lines.length) continue;

      const idx = frame.lineno - 1;
      frame.contextLine = clip(lines[idx] ?? "");
      frame.preContext = lines
        .slice(Math.max(0, idx - CONTEXT_LINES), idx)
        .map(clip);
      frame.postContext = lines.slice(idx + 1, idx + 1 + CONTEXT_LINES).map(clip);
      attached++;
    } catch {
      /* never let context reading break error reporting */
    }
  }
}
