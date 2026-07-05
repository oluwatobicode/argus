import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/db.config";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";
import {
  AddMemberSchema,
  UpdateMemberSchema,
} from "../../validators/member.validator";
import { CreateOrgSchema } from "../../validators/organization.validator";
import { generateAlphaNumeric } from "../../utils/otp.utils";

const USER_SELECT = {
  select: { id: true, name: true, email: true, avatarUrl: true },
} as const;

async function getRequesterMembership(userId: string) {
  return prisma.organizationMember.findFirst({ where: { userId } });
}

/* onboarding for org-less users (OAuth signups) — caller has NO membership yet */
export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const existing = await getRequesterMembership(req.user!.id);
    if (existing) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        "You already belong to an organization.",
      );
    }

    const { name } = CreateOrgSchema.parse(req.body);
    const slug = `${name.toLowerCase().trim().replace(/\s+/g, "-")}-${generateAlphaNumeric(6).toLowerCase()}`;

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        members: { create: { userId: req.user!.id, role: "OWNER" } },
      },
      select: { id: true, name: true, slug: true, plan: true },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.CREATE_SUCCESS,
      org,
    );
  } catch (error) {
    next(error);
  }
};

export const listMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const me = await getRequesterMembership(req.user!.id);
    if (!me) return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    const members = await prisma.organizationMember.findMany({
      where: { orgId: me.orgId },
      include: { user: USER_SELECT },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.FETCH_SUCCESS,
      members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    );
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const me = await getRequesterMembership(req.user!.id);
    if (!me) return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    const { email, role } = AddMemberSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        "No Argus user with that email — they need to sign up first.",
      );
    }

    const existing = await prisma.organizationMember.findFirst({
      where: { userId: user.id, orgId: me.orgId },
    });
    if (existing) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        "That user is already a member of this organization.",
      );
    }

    const member = await prisma.organizationMember.create({
      data: { userId: user.id, orgId: me.orgId, role },
      include: { user: USER_SELECT },
    });

    return sendSuccess(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.CREATE_SUCCESS, {
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      user: member.user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const me = await getRequesterMembership(req.user!.id);
    if (!me) return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    const { role: newRole } = UpdateMemberSchema.parse(req.body);
    const target = await prisma.organizationMember.findFirst({
      where: { id: req.params.id as string, orgId: me.orgId },
    });
    if (!target) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Member not found");
    }

    /* only an OWNER may grant or revoke the OWNER role */
    const touchesOwner = newRole === "OWNER" || target.role === "OWNER";
    if (touchesOwner && me.role !== "OWNER") {
      return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    /* never demote the last OWNER */
    if (target.role === "OWNER" && newRole !== "OWNER") {
      const owners = await prisma.organizationMember.count({
        where: { orgId: me.orgId, role: "OWNER" },
      });
      if (owners <= 1) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "The organization must always have at least one owner.",
        );
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id: target.id },
      data: { role: newRole },
      include: { user: USER_SELECT },
    });

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.UPDATE_SUCCESS, {
      id: updated.id,
      role: updated.role,
      createdAt: updated.createdAt,
      user: updated.user,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const me = await getRequesterMembership(req.user!.id);
    if (!me) return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    const target = await prisma.organizationMember.findFirst({
      where: { id: req.params.id as string, orgId: me.orgId },
    });
    if (!target) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Member not found");
    }

    if (target.role === "OWNER") {
      if (me.role !== "OWNER") {
        return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
      }
      const owners = await prisma.organizationMember.count({
        where: { orgId: me.orgId, role: "OWNER" },
      });
      if (owners <= 1) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          "The organization must always have at least one owner.",
        );
      }
    }

    await prisma.organizationMember.delete({ where: { id: target.id } });

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.DELETE_SUCCESS);
  } catch (error) {
    next(error);
  }
};
