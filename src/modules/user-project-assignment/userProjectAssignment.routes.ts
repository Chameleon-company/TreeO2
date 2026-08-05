import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { userProjectAssignmentController } from "./userProjectAssignment.controller";
import "./userProjectAssignment.docs";

const router = Router();

router.get(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER"]),
	(req, res, next) => {
		void userProjectAssignmentController.getAssignments(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	(req, res, next) => {
		void userProjectAssignmentController.assignUserToProject(req, res, next);
	},
);

router.delete(
	"/:user_id/:project_id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	(req, res, next) => {
		void userProjectAssignmentController.removeUserFromProject(req, res, next);
	},
);

export default router;
