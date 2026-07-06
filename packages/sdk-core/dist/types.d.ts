export interface StackFrame {
    filename: string;
    function?: string;
    lineno: number;
    colno?: number;
}
export interface Breadcrumb {
    type: string;
    message?: string;
    timestamp?: number;
    data?: Record<string, unknown>;
}
export interface ExceptionPayload {
    type: string;
    value: string;
    stacktrace: {
        frames: StackFrame[];
    };
}
export interface WebVitals {
    lcp?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
}
export interface TransactionEnvelope {
    type: "transaction";
    name: string;
    duration: number;
    timestamp: number;
    status?: string;
    traceId?: string;
    vitals?: WebVitals;
}
export interface Envelope {
    level?: "fatal" | "error" | "warning" | "info" | "debug";
    timestamp?: number;
    environment?: string;
    release?: string;
    exception: ExceptionPayload;
    user?: {
        id?: string;
        email?: string;
    };
    breadcrumbs?: Breadcrumb[];
    contexts?: {
        browser?: {
            name: string;
            version: string;
        };
        os?: {
            name: string;
            version: string;
        };
    };
    tags?: Record<string, string>;
    request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
    };
}
