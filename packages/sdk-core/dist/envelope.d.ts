import type { Envelope, StackFrame } from "./types";
export interface EnvelopeOptions {
    level?: Envelope["level"];
    environment?: string;
    release?: string;
    user?: Envelope["user"];
    tags?: Envelope["tags"];
    breadcrumbs?: Envelope["breadcrumbs"];
    contexts?: Envelope["contexts"];
    request?: Envelope["request"];
}
export declare function buildEnvelope(type: string, value: string, frames: StackFrame[], options?: EnvelopeOptions): Envelope;
