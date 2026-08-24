import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { userOrganisationRolesController } from "./userOrganisationRoles.controller";
import "./userOrganisationRoles.docs";
import { validateMiddleware } from "@/middleware/validate.middleware";
import { AddUserOrganisationRoleReq, RemoveUserOrganisationRoleReq } from "./userOrganisationRoles.schema";

const router = Router();

router.post(
	"/",
	authMiddleware,
	validateMiddleware(AddUserOrganisationRoleReq),
	(req, res, next) => {
		void userOrganisationRolesController.addUserOrganisationRole(req as AddUserOrganisationRoleReq, res, next);
	},
);

router.delete(
	"/:userId/:organisationId/:roleId",
	authMiddleware,
	validateMiddleware(RemoveUserOrganisationRoleReq),
	(req, res, next) => {
		void userOrganisationRolesController.removeUserOrganisationRole(req as unknown as RemoveUserOrganisationRoleReq, res, next);
	},
);

export default router;