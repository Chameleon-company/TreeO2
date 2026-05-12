import { Router } from "express";
import { adoptersController } from "./adopters.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Adopters
 *     description: Adopter management APIs
 */

/**
 * @openapi
 * /adopters:
 *   post:
 *     tags:
 *       - Adopters
 *     summary: Create adopter
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => void adoptersController.createAdopter(req, res, next),
);

/**
 * @openapi
 * /adopters:
 *   get:
 *     tags:
 *       - Adopters
 *     summary: Get all adopters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/",
  authMiddleware,
  (req, res, next) => void adoptersController.listAdopters(req, res, next),
);

/**
 * @openapi
 * /adopters/{id}:
 *   get:
 *     tags:
 *       - Adopters
 *     summary: Get adopter by ID
 */
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => void adoptersController.getAdopterById(req, res, next),
);

/**
 * @openapi
 * /adopters/{id}:
 *   put:
 *     tags:
 *       - Adopters
 *     summary: Update adopter
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => void adoptersController.updateAdopter(req, res, next),
);

/**
 * @openapi
 * /adopters/{id}:
 *   delete:
 *     tags:
 *       - Adopters
 *     summary: Delete adopter
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => void adoptersController.deleteAdopter(req, res, next),
);

export default router;
