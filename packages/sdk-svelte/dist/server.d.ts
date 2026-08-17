import { type EnvelopeOptions } from "@argusdev/sdk-core";
import { type ArgusErrorInput } from "./shared.js";
export interface ServerInitOptions {
    dsn: string;
    environment?: string;
    release?: string;
}
export declare function init(options: ServerInitOptions): void;
export declare function captureException(err: unknown, extra?: EnvelopeOptions): Promise<void>;
export declare function handleErrorWithArgus<T extends ArgusErrorInput, R>(userHandler?: (input: T) => R): (input: T) => Promise<Awaited<R> | void>;
