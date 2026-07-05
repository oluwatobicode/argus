import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/requirePermission.middleware";
import { PERMISSIONS } from "../config/permissions.config";
import { projectsController } from "../controllers";

const router = Router();

const manage = requirePermission(PERMISSIONS.PROJECT_MANAGE);

router.get("/", ensureAuth, projectsController.listProjects);
router.post("/", ensureAuth, manage, projectsController.createProject);
router.get("/:id", ensureAuth, projectsController.getProject);
router.patch("/:id", ensureAuth, manage, projectsController.updateProject);
router.delete("/:id", ensureAuth, manage, projectsController.deleteProject);

export default router;
