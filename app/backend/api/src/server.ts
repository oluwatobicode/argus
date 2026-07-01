import app from "./app";
import { prisma } from "./config/db.config";
import redis from "./config/redis.config";
import { connectSessionStore } from "./config/session.config";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    /* postgresql */
    await prisma.$connect();
    console.log("Database connected 🤩");

    /* redis */
    await redis.ping();
    console.log("Redis cache connected 🚀");

    /* session store (separate redis client) */
    await connectSessionStore();
    console.log("Session store connected 🔐");

    app.listen(PORT, () => {
      console.log(`app is alive ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database ☹️", error);
    process.exit(1);
  }
}

void startServer();
