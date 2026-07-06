import { Queue } from "bullmq";
import {
  ValidatedEnvelope,
  ValidatedTransaction,
} from "../validators/envelope.validator";
import { parseRedisUrl } from "../utils/redis.util";

const connection = parseRedisUrl(process.env.REDIS_URL!);

const eventQueue = new Queue("argus-events", { connection });

/* transient worker failures (db blip) retry instead of dropping the event */
const JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2_000 },
  removeOnComplete: true,
} as const;

export const addEvent = async (
  projectId: string,
  envelope: ValidatedEnvelope,
) => {
  await eventQueue.add("error-event", { projectId, envelope }, JOB_OPTS);
};

export const addPerfEvent = async (
  projectId: string,
  envelope: ValidatedTransaction,
) => {
  await eventQueue.add("perf-event", { projectId, envelope }, JOB_OPTS);
};
