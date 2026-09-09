import { Router } from "express";
import { adoptionsController } from "./adoptions.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * CREATE ADOPTION (ADMIN ONLY)
 */
router.post(
	"/",
	authMiddleware,
	(req, res, next) => void adoptionsController.createAdoption(req, res, next),
);

/**
 * LIST ADOPTIONS (ADMIN + MANAGER)
 */
router.get(
	"/",
	authMiddleware,
	(req, res, next) => {
		void adoptionsController.listAdoptions(req, res, next);
	},
);

/**
 * GET BY ID (ADMIN + MANAGER)
 */
router.get(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void adoptionsController.getAdoptionById(req, res, next);
	},
);

/**
 * UPDATE (ADMIN ONLY)
 */
router.put(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void adoptionsController.updateAdoption(req, res, next);
	},
);

/**
 * DELETE (ADMIN ONLY)
 */
router.delete(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void adoptionsController.deleteAdoption(req, res, next);
	},
);

export default router;
