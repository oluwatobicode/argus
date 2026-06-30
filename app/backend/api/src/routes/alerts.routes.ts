import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { alertsController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", ensureAuth, alertsController.listAlerts);
router.post("/", ensureAuth, alertsController.createAlert);
router.patch("/:id", ensureAuth, alertsController.updateAlert);
router.delete("/:id", ensureAuth, alertsController.deleteAlert);

export default router;
