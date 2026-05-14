import { Router } from "express";
import { adoptersController } from "./adopters.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

/**
 * CREATE ADOPTER (ADMIN ONLY)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => void adoptersController.createAdopter(req, res, next),
);

/**
 * LIST ADOPTERS (ADMIN + MANAGER)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void adoptersController.listAdopters(req, res, next);
  },
);

/**
 * GET BY ID (ADMIN + MANAGER)
 */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void adoptersController.getAdopterById(req, res, next);
  },
);

/**
 * UPDATE (ADMIN ONLY)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void adoptersController.updateAdopter(req, res, next);
  },
);

/**
 * DELETE (ADMIN ONLY)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void adoptersController.deleteAdopter(req, res, next);
  },
);

export default router;
