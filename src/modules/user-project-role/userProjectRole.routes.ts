import { Router, type Request } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { userProjectRoleController } from "./userProjectRole.controller";
import {
	UserProjectRoleDeleteReq,
	UserProjectRoleListReq,
	UserProjectRoleReq,
	type UserProjectRoleDeleteReq as UserProjectRoleDeleteReqType,
	type UserProjectRoleListReq as UserProjectRoleListReqType,
	type UserProjectRoleReq as UserProjectRoleReqType,
} from "./userProjectRole.schema";
import "./userProjectRole.docs";

const router = Router();

// TODO(T2-2026 API15): Apply capability-based authorization
// to User Project Role endpoints after the auth migration is available.
router.get(
	"/",
	authMiddleware,
	validateMiddleware(UserProjectRoleListReq),
	(req, res, next) => {
		void userProjectRoleController.getRoles(
			req as Request & UserProjectRoleListReqType,
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
		void userProjectRoleController.assignRole(
			req as Request & UserProjectRoleReqType,
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
			req as Request & UserProjectRoleDeleteReqType,
			res,
			next,
		);
	},
);

export default router;
