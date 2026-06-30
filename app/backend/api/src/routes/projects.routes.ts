import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { projectsController } from "../controllers";

const router = Router();

router.get("/", ensureAuth, projectsController.listProjects);
router.post("/", ensureAuth, projectsController.createProject);
router.get("/:id", ensureAuth, projectsController.getProject);
router.patch("/:id", ensureAuth, projectsController.updateProject);
router.delete("/:id", ensureAuth, projectsController.deleteProject);

export default router;
