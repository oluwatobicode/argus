import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/requirePermission.middleware";
import { PERMISSIONS } from "../config/permissions.config";
import { billingController } from "../controllers";

const router = Router();

const manageBilling = requirePermission(PERMISSIONS.BILLING_MANAGE);

router.post("/checkout", ensureAuth, manageBilling, billingController.createCheckoutSession);
router.post("/portal", ensureAuth, manageBilling, billingController.createBillingPortal);
router.post("/webhook", billingController.handleWebhook);

export default router;
