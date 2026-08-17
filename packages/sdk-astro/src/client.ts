/*
 * The client half. The integration injects a page script importing from HERE
 * (not from sdk-browser directly): "@argusdev/sdk-astro/client" is what the
 * user actually installed, so it resolves under every node_modules layout —
 * including pnpm's strict isolation, where a transitive dep would not.
 */
export { init, captureException } from "@argusdev/sdk-browser";
export type { InitOptions } from "@argusdev/sdk-browser";
