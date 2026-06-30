import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { performanceController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/transactions", ensureAuth, performanceController.listTransactions);
router.get("/vitals", ensureAuth, performanceController.getWebVitals);

export default router;
