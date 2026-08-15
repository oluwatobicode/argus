/*
 * Types only — this entry has no runtime, on purpose.
 *
 * Next.js runs two different runtimes out of one module graph, so the entry
 * point has to be explicit rather than guessed:
 *
 *   @argusdev/sdk-nextjs/client   client components, error.tsx, global-error.tsx
 *   @argusdev/sdk-nextjs/server   instrumentation.ts — register() + onRequestError
 *
 * Importing the client half into a server component (or vice versa) is the
 * single most common way to break a Next build; separate subpaths make that
 * mistake impossible instead of merely unlikely.
 */
export {};
//# sourceMappingURL=index.js.map