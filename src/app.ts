import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

import * as swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Module route imports
import { healthRoutes } from "./modules/health";

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.NODE_ENV === "production" ? false : "*" }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  }),
);

// Parsing
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Module Routes
app.use("/health", healthRoutes);

// 404 & error handler
app.use(notFound);
app.use(errorHandler);

export default app;
