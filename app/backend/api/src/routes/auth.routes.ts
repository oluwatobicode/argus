import { Router } from "express";
import { googleAuth, googleCallback, githubAuth, githubCallback, register, login, logout, me } from "../controllers/auth/auth.controller";
import { ensureAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", ensureAuth, me);

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;
