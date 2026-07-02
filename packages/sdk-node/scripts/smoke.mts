/*
 * sdk-node smoke test — pretends to be a user's app that crashes.
 * Usage: npx tsx packages/sdk-node/scripts/smoke.mts "<dsn>"
 * Expect: worker logs a completed job; a new Issue "TypeError: Cannot read
 *         properties of undefined (reading 'crash')" appears; process exits 1.
 */
import { init } from "../src/index";

const dsn = process.argv[2];
if (!dsn) {
  console.error('Usage: npx tsx packages/sdk-node/scripts/smoke.mts "<dsn>"');
  process.exit(2);
}

/* what a real user writes — two lines: */
init({ dsn, environment: "development", release: "0.1.0" });

console.log("→ SDK initialized, now crashing on purpose…");

function billing(user: { plan?: { name: string } }) {
  /* the classic: property of undefined */
  return (user.plan as unknown as { crash: string }).crash;
}

setTimeout(() => billing({}), 100); /* uncaught throw, outside any try/catch */
