import { Router } from "express";
import { partnersController } from "./partners.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import "./partners.docs";

const router = Router();

// Returns the full list of partners. Accessible by Admin and Manager.
router.get(
	"/",
	authMiddleware,
	(req, res, next) => {
		void partnersController.getAllPartners(req, res, next);
	},
);

// Returns a single partner by ID. Accessible by Admin and Manager.
router.get(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void partnersController.getPartnerById(req, res, next);
	},
);

// Creates a new partner. Only Admin can do this.
router.post(
	"/",
	authMiddleware,
	(req, res, next) => {
		void partnersController.createPartner(req, res, next);
	},
);

// Updates a partner by ID. Only Admin can do this.
router.put(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void partnersController.updatePartner(req, res, next);
	},
);

// Deletes a partner by ID. Only Admin can do this.
router.delete(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void partnersController.deletePartner(req, res, next);
	},
);

export default router;
