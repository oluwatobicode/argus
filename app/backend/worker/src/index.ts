import { Worker, UnrecoverableError } from "bullmq";
import type { Job } from "bullmq";
import connection from "./config/redis.config";
import { processErrorEvent } from "./processors/errorEvent.processor";
import type { JobData } from "./types";

/* route by job name so future job types (perf events) get their own processor */
async function processJob(job: Job<JobData>): Promise<void> {
  switch (job.name) {
    case "error-event":
      return processErrorEvent(job);
    default:
      throw new UnrecoverableError(`Unknown job name: ${job.name}`);
  }
}

const worker = new Worker("argus-events", processJob, {
  connection,
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log("🚀 Worker listening on queue: argus-events");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
