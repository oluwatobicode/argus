export interface NormalizedAngularError {
    error: Error;
    tags: Record<string, string>;
}
export declare function normalizeAngularError(input: unknown): NormalizedAngularError;
