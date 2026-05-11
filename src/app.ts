import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { securityAuditMiddleware } from "./middleware/securityAudit.middleware";

import adoptersRouter from "./modules/adopters/adopters.routes";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

/**
 * =========================================
 * SECURITY MIDDLEWARE
 * =========================================
 */
app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? false : "*",
  }),
);

/**
 * =========================================
 * BODY PARSING (MUST COME BEFORE CUSTOM MIDDLEWARE)
 * =========================================
 */

app.use(express.json({ type: "application/json" }));
app.use(express.urlencoded({ extended: false }));

app.use("/adopters", adoptersRouter);

/**
 * =========================================
 * CUSTOM SECURITY AUDIT
 * (AFTER BODY PARSER to avoid UTF-8 error)
 * =========================================
 */
app.use(securityAuditMiddleware);

/**
 * =========================================
 * PERFORMANCE MIDDLEWARE
 * =========================================
 */
app.use(compression());

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

/**
 * =========================================
 * SWAGGER DOCS
 * =========================================
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * =========================================
 * ROUTES
 * =========================================
 * IMPORTANT:
 * Avoid duplicate mounting if routes.ts already includes adopters.
 */
// Use ONLY ONE approach:

// Option B (if routes.ts already contains everything)
// app.use("/", routes);

/**
 * =========================================
 * ERROR HANDLING
 * =========================================
 */
app.use(notFound);
app.use(errorHandler);

export default app;
