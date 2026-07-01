import { Queue } from "bullmq";
import { ValidatedEnvelope } from "../validators/envelope.validator";
import { parseRedisUrl } from "../utils/redis.util";

const connection = parseRedisUrl(process.env.REDIS_URL!);

const eventQueue = new Queue("argus-events", { connection });

export const addEvent = async (
  projectId: string,
  envelope: ValidatedEnvelope,
) => {
  await eventQueue.add(
    "error-event",
    { projectId, envelope },
    {
      /* transient worker failures (db blip) retry instead of dropping the event */
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: true,
    },
  );
};
