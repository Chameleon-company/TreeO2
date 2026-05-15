import { Router } from "express";
import { HealthController } from "./health.controller";

const router = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/", (req, res) => {
  void healthController.getHealth(req, res);
});

export default router;
