import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { userOrganisationRolesController } from "./userOrganisationRoles.controller";
import { validateMiddleware } from "../../middleware/validate.middleware";
import {
	AddUserOrganisationRoleReq,
	RemoveUserOrganisationRoleReq,
} from "./userOrganisationRoles.schema";

const router = Router();

// TODO: (T2 2026 API12) add capability-based permission middleware
router.post(
	"/",
	authMiddleware,
	validateMiddleware(AddUserOrganisationRoleReq),
	(req, res, next) => {
		void userOrganisationRolesController.addUserOrganisationRole(
			req as AddUserOrganisationRoleReq,
			res,
			next,
		);
	},
);

// TODO: (T2 2026 API12) add capability-based permission middleware
router.delete(
	"/:userId/:organisationId/:roleId",
	authMiddleware,
	validateMiddleware(RemoveUserOrganisationRoleReq),
	(req, res, next) => {
		void userOrganisationRolesController.removeUserOrganisationRole(
			req as unknown as RemoveUserOrganisationRoleReq,
			res,
			next,
		);
	},
);

export default router;
