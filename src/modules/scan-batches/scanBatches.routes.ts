import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";

import {
	getScanBatchesController,
	getScanBatchByIdController,
	createScanBatchController,
	deleteScanBatchController,
} from "./scanBatches.controller";

import "./scan-batches.docs";

const router = Router();

router.get(
	"/",
	authMiddleware,
	requirePermission("scan_batches:read"),
	(req, res, next) => {
		void getScanBatchesController(req, res, next);
	},
);

router.get(
	"/:id",
	authMiddleware,
	requirePermission("scan_batches:read"),
	(req, res, next) => {
		void getScanBatchByIdController(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	requirePermission("scan_batches:create"),
	(req, res, next) => {
		void createScanBatchController(req, res, next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	requirePermission("scan_batches:delete"),
	(req, res, next) => {
		void deleteScanBatchController(req, res, next);
	},
);

export default router;
