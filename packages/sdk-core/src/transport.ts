/*
 * TODO(you): sendEnvelope(url, publicKey, envelope)
 *
 * fetch() POST, Content-Type: application/json,
 * header: x-sentry-auth: Sentry sentry_key=<publicKey>
 *
 * Rules (from packages/README.md):
 *   - NEVER throw into the host app — catch everything, console.warn at most
 *   - 429 (rate limit / quota) → drop silently, no retry
 *   - network failure → small retry with backoff, then give up
 */

export {};
