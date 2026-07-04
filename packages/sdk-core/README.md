# @argusdev/sdk-core

Shared internals for the [Argus](https://github.com/oluwatobicode/argus) SDKs — DSN parsing, envelope building, and transport.

> **You don't install this directly.** It's a dependency of `@argusdev/sdk-browser`, `@argusdev/sdk-node`, and `@argusdev/sdk-react`. Install one of those instead.

## What's inside

- `parseDsn(dsn)` / `getIngestUrl(parsed)` — parse a DSN, build the ingest URL
- `buildEnvelope(type, value, frames, options)` — construct a validated event envelope (timestamps in ms)
- `sendEnvelope(url, publicKey, envelope)` — `fetch` transport with retry; **never throws** into the host app, drops silently on 429

MIT © Treasure Odetokun
