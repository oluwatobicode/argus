import { Router } from "express";
import { ingestController } from "../controllers";
import { dsnAuth } from "../middlewares/dsnAuth.middleware";
import { rateLimiter } from "../middlewares/rateLimiter.middleware";
import { quotaLimit } from "../middlewares/quota.middleware";

const router = Router();

router.post(
  "/:projectId/envelope",
  dsnAuth,
  rateLimiter,
  quotaLimit,
  ingestController.ingestEnvelope,
);

export default router;
