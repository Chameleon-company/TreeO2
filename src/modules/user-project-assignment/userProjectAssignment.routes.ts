import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import { userProjectAssignmentController } from "./userProjectAssignment.controller";
import "./userProjectAssignment.docs";

const router = Router();

router.get(
	"/",
	authMiddleware,
	requirePermission("user_project_roles:read"),
	(req, res, next) => {
		void userProjectAssignmentController.getAssignments(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	requirePermission("user_project_roles:create"),
	(req, res, next) => {
		void userProjectAssignmentController.assignUserToProject(req, res, next);
	},
);

router.delete(
	"/:user_id/:project_id",
	authMiddleware,
	requirePermission("user_project_roles:delete"),
	(req, res, next) => {
		void userProjectAssignmentController.removeUserFromProject(req, res, next);
	},
);

export default router;
