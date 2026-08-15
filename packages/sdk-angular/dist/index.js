/* Public surface of @argusdev/sdk-angular */
export { ArgusErrorHandler } from "./error-handler.js";
export { normalizeAngularError } from "./normalize.js";
/* re-export the browser SDK so Angular users need exactly one import:
   import { init, ArgusErrorHandler } from "@argusdev/sdk-angular" */
export { init, captureException } from "@argusdev/sdk-browser";
//# sourceMappingURL=index.js.map