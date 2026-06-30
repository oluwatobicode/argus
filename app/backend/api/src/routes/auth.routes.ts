import { Router } from "express";
import { ensureAuth } from "../middlewares/auth.middleware";
import { authController } from "../controllers";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", ensureAuth, authController.me);

router.post("/verify-otp", authController.verifyOtp);
router.post("/send-otp", authController.sendOtp);

router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

router.get("/github", authController.githubAuth);
router.get("/github/callback", authController.githubCallback);

export default router;
