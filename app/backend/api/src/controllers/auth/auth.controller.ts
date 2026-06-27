import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import passport from "passport";
import { prisma } from "../../config/db.config";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ status: "error", message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ status: "error", message: "Login failed" });
      return res.status(201).json({ status: "success", user: { id: user.id, email: user.email, name: user.name } });
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    req.login(user, (err) => {
      if (err) return res.status(500).json({ status: "error", message: "Login failed" });
      return res.json({ status: "success", user: { id: user.id, email: user.email, name: user.name } });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

export function logout(req: Request, res: Response) {
  req.logout(() => {
    res.json({ status: "success", message: "Logged out" });
  });
}

export function googleAuth(req: Request, res: Response, next: (...args: any[]) => void) {
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
}

export function googleCallback(req: Request, res: Response, next: (...args: any[]) => void) {
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL || "http://localhost:5173",
    failureRedirect: process.env.FRONTEND_URL || "http://localhost:5173/login",
  })(req, res, next);
}

export function githubAuth(req: Request, res: Response, next: (...args: any[]) => void) {
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
}

export function githubCallback(req: Request, res: Response, next: (...args: any[]) => void) {
  passport.authenticate("github", {
    successRedirect: process.env.FRONTEND_URL || "http://localhost:5173",
    failureRedirect: process.env.FRONTEND_URL || "http://localhost:5173/login",
  })(req, res, next);
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ status: "error", message: "Not authenticated" });
  }
  res.json({ status: "success", user: req.user });
}
