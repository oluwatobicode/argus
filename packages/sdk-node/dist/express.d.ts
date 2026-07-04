interface RequestLike {
    method?: string;
    originalUrl?: string;
    url?: string;
}
export declare function argusErrorHandler(): (err: unknown, req: RequestLike, _res: unknown, next: (err?: unknown) => void) => void;
export {};
