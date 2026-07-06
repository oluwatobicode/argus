import type { Job } from "bullmq";
import { UnrecoverableError } from "bullmq";
import { prisma } from "../config/db.config";
import type { PerfJobData } from "../types";

export async function processPerfEvent(job: Job<PerfJobData>): Promise<void> {
  const { projectId, envelope } = job.data;

  /* guard the shape — a malformed payload should fail once, not retry forever */
  if (
    !projectId ||
    envelope?.type !== "transaction" ||
    typeof envelope.name !== "string" ||
    typeof envelope.duration !== "number"
  ) {
    throw new UnrecoverableError(
      `Malformed transaction envelope on job ${job.id}`,
    );
  }

  await prisma.transaction.create({
    data: {
      projectId,
      name: envelope.name,
      duration: envelope.duration,
      status: envelope.status ?? "ok",
      traceId: envelope.traceId ?? job.id ?? `perf-${Date.now()}`,
      vitals: (envelope.vitals as object) ?? undefined,
      timestamp: envelope.timestamp ? new Date(envelope.timestamp) : new Date(),
    },
  });
}
