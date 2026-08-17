interface HttpArgumentsHostLike {
    getRequest(): RequestLike;
    getResponse(): ResponseLike;
}
interface ArgumentsHostLike {
    switchToHttp(): HttpArgumentsHostLike;
}
interface RequestLike {
    method?: string;
    url?: string;
    headers?: Record<string, string | string[] | undefined>;
}
interface ResponseLike {
    status(code: number): ResponseLike;
    json?(body: unknown): unknown;
    send?(body: unknown): unknown;
}
export declare class ArgusExceptionFilter {
    catch(exception: unknown, host: ArgumentsHostLike): void;
}
export {};
