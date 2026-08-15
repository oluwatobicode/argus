import type { InitOptions } from "@argusdev/sdk-browser";
import type { App } from "vue";
export type ArgusVueOptions = InitOptions;
export declare function attachVueErrorHandler(app: App): void;
export declare const argusVue: {
    install(app: App, options: ArgusVueOptions): void;
};
