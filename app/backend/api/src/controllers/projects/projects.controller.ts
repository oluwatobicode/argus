import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../../config/db.config";
import { generateAlphaNumeric } from "../../utils/otp.utils";
import { sendError, sendSuccess } from "../../interface/ApiResponse";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  ORGANIZATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../../config/constants.config";

async function getUserOrg(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { org: true },
  });
  return membership?.org ?? null;
}

export const listProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const projects = await prisma.project.findMany({
      where: { orgId: org.id },
      include: { keys: true },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.PROJECTS_FETCHED,
      projects,
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    if (!name) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.REQUIRED_FIELD("Name"),
      );
    }

    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    if (org.plan === "FREE") {
      const projectCount = await prisma.project.count({
        where: { orgId: org.id },
      });
      if (projectCount >= 1) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          ORGANIZATION_MESSAGES.ONE_PROJECT,
        );
      }
    }

    let slug = name.toLowerCase().trim().replace(/\s+/g, "-");

    /* slug is unique per org — suffix on collision instead of a 500 */
    const slugTaken = await prisma.project.findFirst({
      where: { orgId: org.id, slug },
    });
    if (slugTaken) {
      slug = `${slug}-${generateAlphaNumeric(4).toLowerCase()}`;
    }

    const host = process.env.DSN_HOST || "localhost:3000";
    const publicKey = crypto.randomUUID();

    /* DSN embeds project.id — the ingest route is /:projectId/envelope */
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: { name, slug, orgId: org.id },
      });
      const key = await tx.projectKey.create({
        data: {
          projectId: created.id,
          publicKey,
          dsn: `https://${publicKey}@${host}/${created.id}`,
        },
      });
      return { ...created, keys: [key] };
    });

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.PROJECT_CREATED,
      project,
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.id as string, orgId: org.id },
      include: { keys: true },
    });

    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.FETCH_SUCCESS,
      project,
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    if (!name) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.REQUIRED_FIELD("Name"),
      );
    }

    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.id as string, orgId: org.id },
    });

    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { name },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.PROJECT_UPDATED,
      updated,
    );
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const org = await getUserOrg(req.user!.id);
    if (!org) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.id as string, orgId: org.id },
    });

    if (!project) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PROJECT_NOT_FOUND,
      );
    }

    await prisma.project.delete({ where: { id: project.id } });

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROJECT_DELETED);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
