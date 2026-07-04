import "dotenv/config";
import { Polar } from "@polar-sh/sdk";

const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server,
});

export const POLAR_PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID ?? "";
export const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? "";
export const POLAR_SUCCESS_URL =
  process.env.POLAR_SUCCESS_URL ??
  `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/projects?upgraded=true`;
