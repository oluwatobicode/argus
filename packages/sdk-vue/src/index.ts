/* Public surface of @argusdev/sdk-vue */

export { argusVue, attachVueErrorHandler } from "./plugin.js";
export type { ArgusVueOptions } from "./plugin.js";

/* re-export the browser SDK so Vue users need exactly one import:
   import { argusVue, captureException } from "@argusdev/sdk-vue" */
export { init, captureException } from "@argusdev/sdk-browser";
export type { InitOptions } from "@argusdev/sdk-browser";
