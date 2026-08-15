import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { userProjectRoleController } from "./userProjectRole.controller";
import { UserProjectRoleReq } from "./userProjectRole.schema";
import "./userProjectRole.docs";

const router = Router();

// TODO: Add proper permission authorisation middleware in API13
router.get("/", authMiddleware, (req, res, next) => {
	void userProjectRoleController.getRoles(req, res, next);
});

// TODO: Add proper permission authorisation middleware in API13
router.post(
	"/",
	authMiddleware,
	validateMiddleware(UserProjectRoleReq),
	(req, res, next) => {
		void userProjectRoleController.assignRole(req, res, next);
	},
);

// TODO: Add proper permission authorisation middleware in API13
router.delete(
	"/:user_id/:project_id/:role_id",
	authMiddleware,
	(req, res, next) => {
		void userProjectRoleController.removeRole(req, res, next);
	},
);

export default router;
