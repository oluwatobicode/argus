import type {
  Project as PrismaProject,
  ProjectKey as PrismaProjectKey,
  User as PrismaUser,
} from "../generated/prisma/client";
import type { MemberRole } from "../config/permissions.config";

declare global {
  namespace Express {
    interface User extends PrismaUser {}

    interface Request {
      project?: PrismaProject;
      projectKey?: PrismaProjectKey;
      rawBody?: Buffer; /* captured by express.json verify — Bachs webhook signature */
      memberRole?: MemberRole; /* set by requirePermission middleware */
    }
  }
}

export {};
