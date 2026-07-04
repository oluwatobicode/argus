import type {
  Project as PrismaProject,
  ProjectKey as PrismaProjectKey,
  User as PrismaUser,
} from "../generated/prisma/client";

declare global {
  namespace Express {
    interface User extends PrismaUser {}

    interface Request {
      project?: PrismaProject;
      projectKey?: PrismaProjectKey;
      rawBody?: Buffer; /* captured by express.json verify — Polar webhook signature */
    }
  }
}

export {};
