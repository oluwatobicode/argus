import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.config";
import { sendError } from "../interface/ApiResponse";

function extractPublicKey(header: string): string | null {
  const match = header.match(/sentry_key[=:]\s*(\S+)/i);
  return match?.[1] ?? null;
}

export async function dsnAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = req.params.projectId;
    const authHeader = req.headers["x-sentry-auth"] as string | undefined;
    const publicKey =
      extractPublicKey(authHeader ?? "") ||
      (req.query.sentry_key as string | undefined);

    if (!publicKey) {
      return sendError(res, 401, "Invalid DSN key");
    }

    const projectKey = await prisma.projectKey.findUnique({
      where: { publicKey },
      include: { project: true },
    });

    if (!projectKey || projectKey.projectId !== projectId) {
      return sendError(res, 401, "Invalid DSN key");
    }

    req.project = projectKey.project;
    req.projectKey = projectKey;
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
}
