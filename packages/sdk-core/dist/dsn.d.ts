export interface ParsedDsn {
    publicKey: string;
    host: string;
    projectId: string;
    protocol: "http" | "https";
}
export declare function parseDsn(dsn: string): ParsedDsn;
export declare function getIngestUrl(parsed: ParsedDsn): string;
