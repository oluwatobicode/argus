import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/requirePermission.middleware";
import { PERMISSIONS } from "../config/permissions.config";
import { organizationsController } from "../controllers";

const router = Router();

router.get("/members", ensureAuth, organizationsController.listMembers);
router.post(
  "/members",
  ensureAuth,
  requirePermission(PERMISSIONS.MEMBER_MANAGE),
  organizationsController.addMember,
);
router.patch(
  "/members/:id",
  ensureAuth,
  requirePermission(PERMISSIONS.MEMBER_MANAGE),
  organizationsController.updateMemberRole,
);
router.delete(
  "/members/:id",
  ensureAuth,
  requirePermission(PERMISSIONS.MEMBER_MANAGE),
  organizationsController.removeMember,
);

export default router;
