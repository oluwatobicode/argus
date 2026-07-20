import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  AUTH_MESSAGES,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import {
  permissionsForRole,
  type MemberRole,
} from "../../config/permissions.config";
import { comparePassword, hashPassword } from "../../utils/password.util";
import { generateAlphaNumeric } from "../../utils/otp.utils";
import redis from "../../config/redis.config";
import crypto from "crypto";
import { sendEmail } from "../../services/email.service";
import { buildOtpEmail, buildWelcomeEmail } from "../../templates/authemail";

/*
 * Fire-and-forget email: a Resend hiccup must never break the auth flow.
 * In non-production we also log the OTP so local dev works without a verified
 * sending domain.
 */
function dispatchOtpEmail(email: string, otp: string) {
  if (process.env.NODE_ENV === "production") {
    console.log(`[dev] OTP for ${email}: ${otp}`);
  }
  const { subject, html } = buildOtpEmail({ otp });
  void sendEmail({ to: email, subject, html }).catch((err) =>
    console.error(`Failed to send OTP email to ${email}:`, err),
  );
}

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

    const normalizedEmail = email.trim().toLowerCase();

    // Check if this email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.DUPLICATE_ENTRY,
      );
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
        memberships: {
          create: {
            role: "OWNER",
            org: {
              create: {
                name: `${name?.split(" ")[0] ?? "Personal"}'s Organization`,
                /* random suffix — org slug is globally unique, email prefixes are not */
                slug: `${normalizedEmail.split("@")[0]}-${generateAlphaNumeric(6).toLowerCase()}`,
              },
            },
          },
        },
      },
    });

    const otp = generateAlphaNumeric(6);
    const hashedOtp = crypto.createHash("sha512").update(otp).digest("hex");
    await redis.set(`otp:${normalizedEmail}`, hashedOtp, "EX", 600);
    dispatchOtpEmail(normalizedEmail, otp);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.SIGNUP_SUCCESS, {
      email: newUser.email,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.REQUIRED_FIELD("Email and OTP"),
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const storedHashedOtp = await redis.get(`otp:${normalizedEmail}`);

    if (!storedHashedOtp) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.OTP_EXPIRED);
    }

    const hashedOtp = crypto.createHash("sha512").update(otp).digest("hex");

    if (hashedOtp !== storedHashedOtp) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.INVALID_OTP);
    }

    const verifiedUser = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        emailVerified: true,
      },
    });

    await redis.del(`otp:${normalizedEmail}`);

    /* welcome email — fire-and-forget, never blocks verification */
    const appUrl = process.env.FRONTEND_URL || "https://argus.dev";
    const welcome = buildWelcomeEmail({
      name: verifiedUser.name ?? "",
      appUrl,
    });
    void sendEmail({
      to: normalizedEmail,
      subject: welcome.subject,
      html: welcome.html,
    }).catch((err) =>
      console.error(`Failed to send welcome email to ${normalizedEmail}:`, err),
    );

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OTP_VERIFIED);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.REQUIRED_FIELD("Email"),
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    if (user.emailVerified) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED,
      );
    }

    const otp = generateAlphaNumeric(6);
    const hashedOtp = crypto.createHash("sha512").update(otp).digest("hex");
    await redis.set(`otp:${normalizedEmail}`, hashedOtp, "EX", 600);
    dispatchOtpEmail(normalizedEmail, otp);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OTP_RESENT);
  } catch (error) {
    console.log(error);
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

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  });
};

//  Me

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.NOT_LOGGED_IN,
      );
    }

    /* the console header needs the user's org (name, slug, plan) */
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
      include: { org: true },
    });

    const organization = membership
      ? {
          id: membership.org.id,
          name: membership.org.name,
          slug: membership.org.slug,
          plan: membership.org.plan,
          role: membership.role,
          permissions: permissionsForRole(membership.role as MemberRole),
        }
      : null;

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.FETCH_SUCCESS, {
      ...req.user,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

//  Google OAuth

export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/projects`,
    );
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
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
  if (req.isAuthenticated()) {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/projects`,
    );
  }
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
