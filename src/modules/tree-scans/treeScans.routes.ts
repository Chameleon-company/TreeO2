import { Router } from "express";
import { treeScansController } from "./treeScans.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import "./treeScans.docs";
import {
	createTreeScanSchema,
	listTreeScansSchema,
	treeScanIdSchema,
	updateTreeScanSchema,
} from "./treeScans.schemas";


const router = Router();

router.get(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER"]),
	validateMiddleware(listTreeScansSchema),
	(req, res, next) => {
		void treeScansController.listTreeScans(req, res, next);
	},
);

router.get(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER", "INSPECTOR"]),
	validateMiddleware(treeScanIdSchema),
	(req, res, next) => {
		void treeScansController.getTreeScanById(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	roleMiddleware(["INSPECTOR"]),
	validateMiddleware(createTreeScanSchema),
	(req, res, next) => {
		void treeScansController.createTreeScan(req, res, next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	validateMiddleware(updateTreeScanSchema),
	(req, res, next) => {
		void treeScansController.updateTreeScan(req, res, next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	validateMiddleware(treeScanIdSchema),
	(req, res, next) => {
		void treeScansController.deleteTreeScan(req, res, next);
	},
);

router.post(
	"/recycle/:fobId",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER"]),
	(req, res, next) => {
		void treeScansController.recycleFob(req, res, next);
	},
);

export default router;
