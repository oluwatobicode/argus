import { Queue } from "bullmq";
import { ValidatedEnvelope } from "../validators/envelope.validator";

const url = new URL(process.env.REDIS_URL!);

const connection = {
  host: url.hostname,
  port: Number(url.port),
  password: url.password,
};

const eventQueue = new Queue("argus-events", { connection });

export const addEvent = async (
  projectId: string,
  envelope: ValidatedEnvelope,
) => {
  await eventQueue.add("error-event", { projectId, envelope });
};
