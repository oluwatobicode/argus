const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/* the backend's ApiResponse envelope */
interface ApiEnvelope<T> {
  statusCode: number;
  status: "success" | "failed";
  message: string;
  data?: T;
  error?: unknown;
}

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include" /* session cookie rides along */,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const envelope = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || envelope.status !== "success") {
    throw new ApiError(envelope.message ?? "Request failed", res.status, envelope.error);
  }

  return envelope.data as T;
}

/* OAuth is a full-page redirect, not a fetch */
export function oauthUrl(provider: "google" | "github"): string {
  return `${API_URL}/auth/${provider}`;
}
