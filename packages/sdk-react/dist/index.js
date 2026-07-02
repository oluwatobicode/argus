/* Public surface of @argus/sdk-react */
export { ArgusErrorBoundary } from "./ErrorBoundary";
/* re-export the browser SDK so React users need exactly one import:
   import { init, ArgusErrorBoundary } from "@argus/sdk-react" */
export { init, captureException } from "@argus/sdk-browser";
//# sourceMappingURL=index.js.map