import type { Envelope, TransactionEnvelope } from "./types.js";
export interface SendOptions {
    keepalive?: boolean;
}
export declare function sendEnvelope(url: string, publicKey: string, envelope: Envelope | TransactionEnvelope, options?: SendOptions): Promise<void>;
