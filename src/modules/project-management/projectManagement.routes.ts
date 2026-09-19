import { Router } from "express";
import { projectManagementController } from "./projectManagement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import "./projectManagement.docs";

const router = Router();

// Route to retrieve all projects.
router.get(
	"/",
	authMiddleware,
	requirePermission("projects:read"),
	(req, res, next) => {
		void projectManagementController.getAllProjects(req, res, next);
	},
);

// Route to retrieve a project by its ID.
router.get(
	"/:id",
	authMiddleware,
	requirePermission("projects:read"),
	(req, res, next) => {
		void projectManagementController.getProjectById(req, res, next);
	},
);

// Route to create a new project.
router.post(
	"/",
	authMiddleware,
	requirePermission("projects:create"),
	(req, res, next) => {
		void projectManagementController.createProject(req, res, next);
	},
);

// Route to update an existing project.
router.put(
	"/:id",
	authMiddleware,
	requirePermission("projects:update"),
	(req, res, next) => {
		void projectManagementController.updateProject(req, res, next);
	},
);

// Route to delete a project.
router.delete(
	"/:id",
	authMiddleware,
	requirePermission("projects:delete"),
	(req, res, next) => {
		void projectManagementController.deleteProject(req, res, next);
	},
);

export default router;
