import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { TreeTypesController } from "./treeTypes.controller";
import "./treeTypes.docs";
import {
	createTreeTypeSchema,
	deleteTreeTypeSchema,
	treeTypeIdSchema,
	updateTreeTypeSchema,
} from "./treeTypes.schemas";

const router = Router();
const treeTypesController = new TreeTypesController();

router.get("/", authMiddleware, (req, res, next) => {
	void treeTypesController.listTreeTypes(req, res).catch(next);
});

router.get(
	"/:id",
	authMiddleware,
	validateMiddleware(treeTypeIdSchema),
	(req, res, next) => {
		void treeTypesController.getTreeTypeById(req, res).catch(next);
	},
);

router.post(
	"/",
	authMiddleware,
	requirePermission("tree_types:read"),
	validateMiddleware(createTreeTypeSchema),
	(req, res, next) => {
		void treeTypesController.createTreeType(req, res).catch(next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	requirePermission("tree_types:update"),
	validateMiddleware(updateTreeTypeSchema),
	(req, res, next) => {
		void treeTypesController.updateTreeType(req, res).catch(next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	requirePermission("tree_types:delete"),
	validateMiddleware(deleteTreeTypeSchema),
	(req, res, next) => {
		void treeTypesController.deleteTreeType(req, res).catch(next);
	},
);

export default router;
