import { type ArgusErrorInput } from "./shared.js";
export { init, captureException } from "@argusdev/sdk-browser";
export type { InitOptions } from "@argusdev/sdk-browser";
export declare function handleErrorWithArgus<T extends ArgusErrorInput, R>(userHandler?: (input: T) => R): (input: T) => Promise<Awaited<R> | void>;
