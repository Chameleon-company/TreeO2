import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { userOrganisationsController } from "./userOrganisations.controller";
import "./userOrganisations.docs";

const router = Router();

router.get(
	"/",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationsController.getUserOrganisations(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationsController.addUserToOrganisation(req, res, next);
	},
);

router.put(
	"/:user_id/:organisation_id",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationsController.updateUserMembershipStatus(req, res, next);
	},
);

router.delete(
	"/:user_id/:organisation_id",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationsController.removeUserMembershipStatus(req, res, next);
	},
);

export default router;