import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { billingController } from "../controllers";

const router = Router();

router.post("/checkout", ensureAuth, billingController.createCheckoutSession);
router.post("/portal", ensureAuth, billingController.createBillingPortal);
router.post("/webhook", billingController.handleWebhook);

export default router;
