/* Public surface of @argusdev/sdk-react */
export { ArgusErrorBoundary } from "./ErrorBoundary.js";
/* re-export the browser SDK so React users need exactly one import:
   import { init, ArgusErrorBoundary } from "@argusdev/sdk-react" */
export { init, captureException } from "@argusdev/sdk-browser";
//# sourceMappingURL=index.js.map