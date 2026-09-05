import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { userProjectRoleController } from "./userProjectRole.controller";
import {
	UserProjectRoleDeleteReq,
	UserProjectRoleListReq,
	UserProjectRoleReq,
} from "./userProjectRole.schema";
import "./userProjectRole.docs";

const router = Router();

// TODO(T2-2026 API15): Apply capability-based authorization:
// GET    -> user_project_roles:read
// POST   -> user_project_roles:assign + role hierarchy validation
// DELETE -> user_project_roles:remove + role hierarchy validation

router.get(
	"/",
	authMiddleware,
	validateMiddleware(UserProjectRoleListReq),
	(req, res, next) => {
		void userProjectRoleController.getRoles(
			req as unknown as UserProjectRoleListReq,
			res,
			next,
		);
	},
);

router.post(
	"/",
	authMiddleware,
	validateMiddleware(UserProjectRoleReq),
	(req, res, next) => {
		const assignedBy = Number(req.user?.sub);

		void userProjectRoleController.assignRole(
			req as unknown as UserProjectRoleReq,
			assignedBy,
			res,
			next,
		);
	},
);

router.delete(
	"/:user_id/:project_id/:role_id",
	authMiddleware,
	validateMiddleware(UserProjectRoleDeleteReq),
	(req, res, next) => {
		void userProjectRoleController.removeRole(
			req as unknown as UserProjectRoleDeleteReq,
			res,
			next,
		);
	},
);

export default router;
