interface ContextLike {
    routePattern?: string;
    url?: {
        pathname?: string;
    };
    request?: {
        method?: string;
        headers?: {
            get(name: string): string | null;
        };
    };
}
export declare const onRequest: (context: ContextLike, next: () => Promise<Response> | Response) => Promise<Response>;
export {};
