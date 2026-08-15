"use client";
import { useEffect } from "react";
import { captureException } from "@argusdev/sdk-browser";
/* one import for the client half — init() is sdk-browser's, which is SSR-safe:
   it no-ops instead of throwing when there's no window */
export { init, captureException } from "@argusdev/sdk-browser";
/*
 * Report an error Next already caught. The digest matches the one the server
 * logged for the same failure, so the two envelopes can be paired up.
 */
export function captureError(error) {
    void captureException(error, error.digest ? { tags: { digest: error.digest } } : {});
}
/*
 * Hook form, for Next's error boundaries:
 *
 *   "use client";
 *   import { useArgusError } from "@argusdev/sdk-nextjs/client";
 *
 *   export default function Error({ error, reset }) {
 *     useArgusError(error);
 *     return <button onClick={reset}>Try again</button>;
 *   }
 *
 * Keyed on the error object so a re-render doesn't re-report the same crash,
 * but a genuinely new one still gets through.
 */
export function useArgusError(error) {
    useEffect(() => {
        captureError(error);
    }, [error]);
}
//# sourceMappingURL=client.js.map