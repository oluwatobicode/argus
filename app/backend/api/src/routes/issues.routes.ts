import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { issuesController } from "../controllers";

const router = Router({ mergeParams: true });

router.get("/", ensureAuth, issuesController.listIssues);
router.get("/:id", ensureAuth, issuesController.getIssue);
router.patch("/:id", ensureAuth, issuesController.updateIssueStatus);

export default router;
