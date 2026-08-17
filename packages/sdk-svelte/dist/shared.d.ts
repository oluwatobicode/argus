export interface ArgusErrorInput {
    error: unknown;
    status?: number;
    message?: string;
    event?: {
        route?: {
            id?: string | null;
        };
        url?: {
            pathname?: string;
        };
        request?: {
            method?: string;
            headers?: {
                get(name: string): string | null;
            };
        };
    };
}
export interface ArgusTagsAndRequest {
    tags: Record<string, string>;
    request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
    };
}
export declare function contextFrom(input: ArgusErrorInput): ArgusTagsAndRequest;
export declare function shouldCapture(input: ArgusErrorInput): boolean;
