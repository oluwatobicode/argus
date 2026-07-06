export interface StackFrame {
  filename: string;
  function?: string;
  lineno: number;
  colno?: number;
}

export interface Breadcrumb {
  type: string;
  message?: string;
  /** ms since epoch — see envelope contract in AGENTS.md */
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

export interface Envelope {
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  /** ms since epoch — validated at ingest, safe to pass to new Date() */
  timestamp?: number;
  environment?: string;
  release?: string;
  exception: ExceptionPayload;
  user?: { id?: string; email?: string };
  breadcrumbs?: Breadcrumb[];
  contexts?: {
    browser?: { name: string; version: string };
    os?: { name: string; version: string };
  };
  tags?: Record<string, string>;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

export interface JobData {
  projectId: string;
  envelope: Envelope;
}

/* performance envelope — mirrors the api's TransactionEnvelopeSchema */
export interface TransactionEnvelope {
  type: "transaction";
  name: string;
  duration: number;
  /** ms since epoch — validated at ingest */
  timestamp: number;
  status?: string;
  traceId?: string;
  vitals?: { lcp?: number; cls?: number; fcp?: number; ttfb?: number };
}

export interface PerfJobData {
  projectId: string;
  envelope: TransactionEnvelope;
}
