export interface ArgusAstroOptions {
    dsn: string;
    environment?: string;
    release?: string;
    vitals?: boolean;
}
interface SetupHookArgs {
    injectScript(stage: "page", content: string): void;
    addMiddleware(middleware: {
        entrypoint: string;
        order: "pre";
    }): void;
    updateConfig(config: {
        vite?: {
            define?: Record<string, string>;
        };
    }): unknown;
}
export interface ArgusAstroIntegration {
    name: string;
    hooks: {
        "astro:config:setup": (args: SetupHookArgs) => void;
    };
}
export declare function argus(options: ArgusAstroOptions): ArgusAstroIntegration;
export default argus;
