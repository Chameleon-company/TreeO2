import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

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
	(req, res, next) => {
		void getScanBatchesController(req, res, next);
	},
);

router.get(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void getScanBatchByIdController(req, res, next);
	},
);

router.post(
	"/",
	authMiddleware,
	(req, res, next) => {
		void createScanBatchController(req, res, next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	(req, res, next) => {
		void deleteScanBatchController(req, res, next);
	},
);

export default router;
