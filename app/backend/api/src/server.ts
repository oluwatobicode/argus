import app from "./app";
import { prisma } from "./config/db.config";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("Database connected 🤩");

    app.listen(PORT, () => {
      console.log(`app is alive ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database ☹️", error);
    process.exit(1);
  }
}

void startServer();
