import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { userOrganisationsController } from "./userOrganisations.controller";
import {
	AddUserOrganisationReq,
	DeleteUserOrganisationReq,
	ListUserOrganisationReq,
	UpdateUserOrganisationReq,
} from "./userOrganisations.schema";
import { validateMiddleware } from "../../middleware/validate.middleware";

const router = Router();

// TODO: (T2 2026 API12) add capability-based permission middleware
// also might need to filter the listing based on the user's organisation access
router.get(
	"/",
	authMiddleware,
	validateMiddleware(ListUserOrganisationReq),
	(req, res, next) => {
		void userOrganisationsController.listUserOrganisations(
			req as unknown as ListUserOrganisationReq,
			res,
			next,
		);
	},
);

// TODO: (T2 2026 API12) add capability-based permission middleware
router.post(
	"/",
	authMiddleware,
	validateMiddleware(AddUserOrganisationReq),
	(req, res, next) => {
		void userOrganisationsController.addUserOrganisation(
			req as AddUserOrganisationReq,
			res,
			next,
		);
	},
);

// TODO: (T2 2026 API12) add capability-based permission middleware
router.put(
	"/:userId/:organisationId",
	authMiddleware,
	validateMiddleware(UpdateUserOrganisationReq),
	(req, res, next) => {
		void userOrganisationsController.updateUserOrganisation(
			req as unknown as UpdateUserOrganisationReq,
			res,
			next,
		);
	},
);

// TODO: (T2 2026 API12) add capability-based permission middleware
router.delete(
	"/:userId/:organisationId",
	authMiddleware,
	validateMiddleware(DeleteUserOrganisationReq),
	(req, res, next) => {
		void userOrganisationsController.deleteUserOrganisation(
			req as unknown as DeleteUserOrganisationReq,
			res,
			next,
		);
	},
);

export default router;
