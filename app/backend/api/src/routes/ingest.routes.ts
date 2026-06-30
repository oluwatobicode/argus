import { Router } from "express";
import { ingestController } from "../controllers";

const router = Router();

router.post("/:projectId/envelope", ingestController.ingestEnvelope);

export default router;
