import { type EnvelopeOptions } from "@argusdev/sdk-core";
export interface ServerInitOptions {
    dsn: string;
    environment?: string;
    release?: string;
}
export declare function init(options: ServerInitOptions): void;
export declare function captureException(err: unknown, extra?: EnvelopeOptions): Promise<void>;
