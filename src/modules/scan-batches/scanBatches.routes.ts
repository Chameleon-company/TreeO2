import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

import {
  getScanBatchesController,
  getScanBatchByIdController,
  createScanBatchController,
  deleteScanBatchController,
} from "./scanBatches.controller";

import { SCAN_BATCHES_AUTH_ROLES } from "./scan-batches.constants";

import "./scan-batches.docs";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware([
    SCAN_BATCHES_AUTH_ROLES.ADMIN,
    SCAN_BATCHES_AUTH_ROLES.MANAGER,
    SCAN_BATCHES_AUTH_ROLES.INSPECTOR,
  ]),
  (req, res, next) => {
    void getScanBatchesController(req, res, next);
  },
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([
    SCAN_BATCHES_AUTH_ROLES.ADMIN,
    SCAN_BATCHES_AUTH_ROLES.MANAGER,
    SCAN_BATCHES_AUTH_ROLES.INSPECTOR,
  ]),
  (req, res, next) => {
    void getScanBatchByIdController(req, res, next);
  },
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware([SCAN_BATCHES_AUTH_ROLES.INSPECTOR]),
  (req, res, next) => {
    void createScanBatchController(req, res, next);
  },
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([SCAN_BATCHES_AUTH_ROLES.ADMIN]),
  (req, res, next) => {
    void deleteScanBatchController(req, res, next);
  },
);

export default router;
