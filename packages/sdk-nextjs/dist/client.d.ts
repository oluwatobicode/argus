export { init, captureException } from "@argusdev/sdk-browser";
export type { InitOptions } from "@argusdev/sdk-browser";
export type NextError = Error & {
    digest?: string;
};
export declare function captureError(error: NextError): void;
export declare function useArgusError(error: NextError): void;
