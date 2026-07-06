import type { Envelope, TransactionEnvelope } from "./types";

const MAX_RETRIES = 2;
const BACKOFF_MS = 1_000;

export interface SendOptions {
  /* survive page unload (perf reports sent on pagehide) */
  keepalive?: boolean;
}

/*
 * Golden rule of an error-tracking SDK: NEVER throw into the host app.
 * Whatever happens here, the worst outcome is a console.warn and a lost event.
 */
export async function sendEnvelope(
  url: string,
  publicKey: string,
  envelope: Envelope | TransactionEnvelope,
  options: SendOptions = {},
): Promise<void> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sentry-auth": `Sentry sentry_key=${publicKey}`,
        },
        body: JSON.stringify(envelope),
        keepalive: options.keepalive ?? false,
      });

      if (res.ok) return;

      /* 429 = over quota / rate limited — drop silently, retrying makes it worse */
      if (res.status === 429) return;

      /* other 4xx = our payload or key is wrong — retrying won't change that */
      if (res.status < 500) {
        console.warn(`[argus] event rejected by server (${res.status})`);
        return;
      }

      /* 5xx → fall through to retry */
    } catch {
      /* network failure → fall through to retry */
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS * 2 ** attempt));
    }
  }

  console.warn("[argus] failed to send event after retries");
}
