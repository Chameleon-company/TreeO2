import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./lib/prisma";

const start = async () => {
  try {
    await prisma.$connect();
    logger.info("Prisma connected");

    app.listen(env.PORT, () => {
      logger.info(`TreeO2 API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err: unknown) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  try {
    await prisma.$disconnect();
    process.exit(0);
  } catch (err: unknown) {
    logger.error("Error during shutdown", { err });
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

void start();
