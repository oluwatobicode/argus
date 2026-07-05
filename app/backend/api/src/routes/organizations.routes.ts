import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/requirePermission.middleware";
import { PERMISSIONS } from "../config/permissions.config";
import { organizationsController } from "../controllers";

const router = Router();

/* onboarding: org-less users create their org — no permission gate (no membership yet) */
router.post("/", ensureAuth, organizationsController.createOrganization);

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
