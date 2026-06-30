import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { usageController } from "../controllers";

const router = Router();

router.get("/", ensureAuth, usageController.getUsage);

export default router;
