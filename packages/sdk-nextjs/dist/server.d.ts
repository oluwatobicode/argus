import { type EnvelopeOptions } from "@argusdev/sdk-core";
export interface ServerInitOptions {
    dsn: string;
    environment?: string;
    release?: string;
}
export declare function init(options: ServerInitOptions): void;
export declare function captureException(err: unknown, extra?: EnvelopeOptions): Promise<void>;
interface NextRequestInfo {
    path?: string;
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
}
interface NextErrorContext {
    routerKind?: string;
    routePath?: string;
    routeType?: string;
    renderSource?: string;
    revalidateReason?: string;
}
export declare function onRequestError(error: unknown, request?: NextRequestInfo, context?: NextErrorContext): Promise<void>;
export {};
