/*
 * @argus/sdk-browser — build order:
 *   1. stacktrace.ts  — parse error.stack (Chrome `at fn (file:l:c)` AND Firefox/Safari `fn@file:l:c`)
 *   2. init.ts        — init({ dsn }): window.onerror + "unhandledrejection" listener
 *   3. breadcrumbs.ts — (later) console/click/fetch trail, max 100
 */

export {};
