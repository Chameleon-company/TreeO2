import app from "./app";
import { env } from "./config/env";
import { pool } from "./config/database";
import { logger } from "./config/logger";

const start = async () => {
  try {
    // Test DB connection - to be removed
    await pool.query("SELECT 1");
    logger.info("Database connected");

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
    await pool.end();
    process.exit(0);
  } catch (err: unknown) {
    logger.error("Error during shutdown", { err });
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown();
});

void start();
