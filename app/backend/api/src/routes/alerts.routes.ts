import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/requirePermission.middleware";
import { PERMISSIONS } from "../config/permissions.config";
import { alertsController } from "../controllers";

const router = Router({ mergeParams: true });

const manage = requirePermission(PERMISSIONS.ALERT_MANAGE);

router.get("/", ensureAuth, alertsController.listAlerts);
router.post("/", ensureAuth, manage, alertsController.createAlert);
router.patch("/:id", ensureAuth, manage, alertsController.updateAlert);
router.delete("/:id", ensureAuth, manage, alertsController.deleteAlert);

export default router;
