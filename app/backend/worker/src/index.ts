import { Worker, UnrecoverableError } from "bullmq";
import type { Job } from "bullmq";
import connection from "./config/redis.config";
import { processErrorEvent } from "./processors/errorEvent.processor";
import { processPerfEvent } from "./processors/perfEvent.processor";
import type { JobData, PerfJobData } from "./types";

/* route by job name — each event kind gets its own processor */
async function processJob(job: Job<JobData | PerfJobData>): Promise<void> {
  switch (job.name) {
    case "error-event":
      return processErrorEvent(job as Job<JobData>);
    case "perf-event":
      return processPerfEvent(job as Job<PerfJobData>);
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
