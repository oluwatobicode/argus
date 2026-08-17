/* Public surface of @argusdev/sdk-nestjs */
export { ArgusExceptionFilter } from "./filter.js";
/* re-export the node SDK so Nest users need exactly one import:
   import { init, ArgusExceptionFilter } from "@argusdev/sdk-nestjs"
   init() also hooks uncaughtException/unhandledRejection — errors thrown
   OUTSIDE the request cycle (startup, timers, queues) still get reported. */
export { init, captureException } from "@argusdev/sdk-node";
//# sourceMappingURL=index.js.map