/*
 * Types only — this entry has no runtime, on purpose.
 *
 * SvelteKit runs two runtimes out of one project, so the entry point is
 * explicit rather than guessed:
 *
 *   @argusdev/sdk-svelte/client   hooks.client.ts — init + handleErrorWithArgus
 *   @argusdev/sdk-svelte/server   hooks.server.ts — init + handleErrorWithArgus
 *
 * The server entry never imports sdk-browser, so no browser code lands in a
 * server or edge bundle.
 */
export {};
//# sourceMappingURL=index.js.map