import "dotenv/config";

const server = process.env.BACHS_SERVER === "production" ? "production" : "sandbox";

const BASE_URL =
  server === "production" ? "https://api.bachs.io" : "https://sandbox-api.bachs.io";

/* thin wrapper around fetch for Bachs REST API */
export async function bachsFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.BACHS_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = (body as any)?.detail ?? res.statusText;
    throw new Error(`Bachs API ${res.status}: ${msg}`);
  }

  return res.json() as Promise<T>;
}

export const BACHS_PRO_PRODUCT_ID = process.env.BACHS_PRO_PRODUCT_ID ?? "";
export const BACHS_WEBHOOK_SECRET = process.env.BACHS_WEBHOOK_SECRET ?? "";
export const BACHS_SUCCESS_URL =
  process.env.BACHS_SUCCESS_URL ??
  `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/projects?upgraded=true`;
export const BACHS_CANCEL_URL =
  process.env.BACHS_CANCEL_URL ??
  `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/projects`;
