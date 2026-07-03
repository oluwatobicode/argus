import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/* session-cookie auth → withCredentials; no bearer token in this app */
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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

/* normalize failures into ApiError so hooks/toasts get the backend message */
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    const message = data?.message ?? error.message ?? "Request failed";
    return Promise.reject(
      new ApiError(message, error.response?.status ?? 0, data?.error),
    );
  },
);

/* OAuth is a full-page redirect, not an XHR */
export function oauthUrl(provider: "google" | "github"): string {
  return `${API_URL}/auth/${provider}`;
}
