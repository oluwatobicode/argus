/*
 * sdk-core smoke test — sends one fake error through the full pipeline.
 *
 * Usage:   npx tsx packages/sdk-core/scripts/smoke.mts "<your DSN>"
 * Needs:   API + worker running (pnpm dev), Postgres + Redis up.
 * Expect:  an Issue titled "Error: smoke test — hello from @argus/sdk-core"
 *          in the dashboard/db, eventCount +1 on every rerun.
 */
import { parseDsn, getIngestUrl, buildEnvelope, sendEnvelope } from "../src/index";

const dsn = process.argv[2];
if (!dsn) {
  console.error('Usage: npx tsx packages/sdk-core/scripts/smoke.mts "<dsn>"');
  process.exit(1);
}

const parsed = parseDsn(dsn);
const url = getIngestUrl(parsed);
console.log("→ posting to:", url);

const envelope = buildEnvelope(
  "Error",
  "smoke test — hello from @argus/sdk-core",
  [
    { filename: "packages/sdk-core/scripts/smoke.mts", function: "main", lineno: 21, colno: 3 },
    { filename: "node:internal/main", function: "run", lineno: 1, colno: 1 },
  ],
  {
    environment: "development",
    release: "0.1.0",
    tags: { via: "sdk-core-smoke" },
    user: { id: "smoke-tester" },
  },
);

await sendEnvelope(url, parsed.publicKey, envelope);
console.log("→ sent (check worker logs for '✅ Job … completed')");
