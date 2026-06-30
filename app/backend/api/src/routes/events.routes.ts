import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { eventsController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", ensureAuth, eventsController.listEvents);

export default router;
