import type { Job } from "bullmq";
import { UnrecoverableError } from "bullmq";
import { prisma } from "../config/db.config";
import { computeFingerprint } from "../utils/fingerprint.util";
import { evaluateNewIssue } from "../services/alert.service";
import type { JobData } from "../types";

export async function processErrorEvent(job: Job<JobData>): Promise<void> {
  const { projectId, envelope } = job.data;

  /* guard the shape — a malformed payload should fail once, not retry forever */
  const frames = envelope?.exception?.stacktrace?.frames;
  if (!projectId || !Array.isArray(frames) || frames.length === 0) {
    throw new UnrecoverableError(
      `Malformed envelope on job ${job.id}: missing projectId or exception.stacktrace.frames`,
    );
  }
  const fingerprint = computeFingerprint(frames);
  const culprit = frames[0]
    ? `${frames[0].filename}:${frames[0].lineno}`
    : null;

  const now = new Date();
  const level = (envelope.level ?? "error").toUpperCase();

  const issue = await prisma.issue.upsert({
    where: {
      projectId_fingerprint: { projectId, fingerprint },
    },
    create: {
      projectId,
      fingerprint,
      title: `${envelope.exception.type}: ${envelope.exception.value}`,
      culprit,
      level: level as any,
      firstSeen: now,
      lastSeen: now,
      eventCount: 1,
    },
    update: {
      lastSeen: now,
      eventCount: { increment: 1 },
    },
  });

  await prisma.event.create({
    data: {
      issueId: issue.id,
      projectId,
      level: level as any,
      message: `${envelope.exception.type}: ${envelope.exception.value}`,
      stacktrace: envelope.exception.stacktrace as any,
      contexts: (envelope.contexts as any) ?? undefined,
      tags: (envelope.tags as any) ?? undefined,
      userContext: (envelope.user as any) ?? undefined,
      request: (envelope.request as any) ?? undefined,
      timestamp: envelope.timestamp ? new Date(envelope.timestamp) : now,
    },
  });

  /* brand-new issue (eventCount just became 1) → fire NEW_ISSUE alerts.
     never let alert delivery fail the job. */
  if (issue.eventCount === 1) {
    await evaluateNewIssue(issue);
  }
}
