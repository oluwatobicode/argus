import { type EnvelopeOptions } from "@argusdev/sdk-core";
export interface InitOptions {
    dsn: string;
    environment?: string;
    release?: string;
    vitals?: boolean;
}
export declare function init(options: InitOptions): void;
export declare function captureException(err: unknown, extra?: EnvelopeOptions): Promise<void>;
