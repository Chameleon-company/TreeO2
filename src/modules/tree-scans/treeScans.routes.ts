import { Router } from "express";
import { treeScansController } from "./treeScans.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
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
	validateMiddleware(listTreeScansSchema),
	(req, res, next) => {
		void treeScansController.listTreeScans(req, res, next);
	},
);

router.get(
	"/:id",
	authMiddleware,
	validateMiddleware(treeScanIdSchema),
	(req, res, next) => {
		void treeScansController.getTreeScanById(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	validateMiddleware(createTreeScanSchema),
	(req, res, next) => {
		void treeScansController.createTreeScan(req, res, next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	validateMiddleware(updateTreeScanSchema),
	(req, res, next) => {
		void treeScansController.updateTreeScan(req, res, next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	validateMiddleware(treeScanIdSchema),
	(req, res, next) => {
		void treeScansController.deleteTreeScan(req, res, next);
	},
);

router.post(
	"/recycle/:fobId",
	authMiddleware,
	(req, res, next) => {
		void treeScansController.recycleFob(req, res, next);
	},
);

export default router;
