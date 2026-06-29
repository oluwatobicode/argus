import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import { comparePassword, hashPassword } from "../../utils/password.util";


export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required");
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    // Check if this email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return sendError(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.DUPLICATE_ENTRY);
    }

    const passwordHash = await hashPassword(password as string);


    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        emailVerified: false,
        accounts: {
          create: {
            provider: "EMAIL",
            providerAccountId: normalizedEmail,
            passwordHash,
          },
        },
      },
    });

    
    req.login(newUser, (err) => {
      if (err) return next(err);
      return sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.SIGNUP_SUCCESS, {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required");
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    // Fetch user + their EMAIL account (which holds the passwordHash)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accounts: {
          where: { provider: "EMAIL" },
        },
      },
    });

    const emailAccount = user?.accounts[0];

    // Guard: no user, no EMAIL account, or account has no password (OAuth-only user)
    if (!user || !emailAccount || !emailAccount.passwordHash) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }

    const isPasswordValid = await comparePassword(
      password as string,
      emailAccount.passwordHash,
    );

    if (!isPasswordValid) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }

    // Establish the session
    req.login(user, (err) => {
      if (err) return next(err);
      return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });
  } catch (error) {
    next(error);
  }
};

//  Logout 

export const logout = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.logout((err) => {
    if (err) return next(err);
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  });
};

//  Me 

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.NOT_LOGGED_IN);
    }
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.FETCH_SUCCESS, req.user);
  } catch (error) {
    next(error);
  }
};

//  Google OAuth 

export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL || "http://localhost:5173",
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
  })(req, res, next);
};

//  GitHub OAuth

export const githubAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
};

export const githubCallback = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate("github", {
    successRedirect: process.env.FRONTEND_URL || "http://localhost:5173",
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
  })(req, res, next);
};
