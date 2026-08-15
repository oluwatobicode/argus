/* Public surface of @argusdev/sdk-vue */
export { argusVue, attachVueErrorHandler } from "./plugin.js";
/* re-export the browser SDK so Vue users need exactly one import:
   import { argusVue, captureException } from "@argusdev/sdk-vue" */
export { init, captureException } from "@argusdev/sdk-browser";
//# sourceMappingURL=index.js.map