import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requireSuperAdmin } from "../middlewares/superAdmin.middleware";
import { adminController } from "../controllers";

const router = Router();

router.use(ensureAuth, requireSuperAdmin);

router.get("/users", adminController.listUsers);
router.get("/organizations", adminController.listOrganizations);
router.get("/stats", adminController.getStats);
router.get("/signups", adminController.getSignupSeries);

export default router;
