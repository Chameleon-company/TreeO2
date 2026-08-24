import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { userOrganisationRolesController } from "./userOrganisationRoles.controller";
import "./userOrganisationRoles.docs";

const router = Router();

router.post(
	"/",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationRolesController.addUserOrganisationRole(req, res, next);
	},
);

router.delete(
	"/:user_id/:organisation_id/:role_id",
	authMiddleware,
	(req, res, next) => {
		void userOrganisationRolesController.removeUserOrganisationRole(req, res, next);
	},
);

export default router;