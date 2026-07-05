import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.config";
import { sendError } from "../interface/ApiResponse";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.config";
import {
  roleHasPermission,
  type MemberRole,
  type Permission,
} from "../config/permissions.config";

/*
 * Gate a route on a permission. Resolves the org from :projectId (project → org)
 * or the user's own membership, loads their role, and checks ROLE_PERMISSIONS.
 * Attaches req.memberRole for downstream controllers.
 */
export function requirePermission(perm: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      let orgId: string | undefined;
      if (req.params.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: req.params.projectId as string },
          select: { orgId: true },
        });
        orgId = project?.orgId;
      } else {
        const membership = await prisma.organizationMember.findFirst({
          where: { userId },
          select: { orgId: true },
        });
        orgId = membership?.orgId;
      }

      if (!orgId) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
      }

      const membership = await prisma.organizationMember.findFirst({
        where: { userId, orgId },
        select: { role: true },
      });

      if (!membership) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
      }

      const role = membership.role as MemberRole;
      if (!roleHasPermission(role, perm)) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
      }

      req.memberRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
