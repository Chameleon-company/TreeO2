import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

import {
  getScanBatchesController,
  getScanBatchByIdController,
  createScanBatchController,
  deleteScanBatchController,
} from "../controllers/scanBatches.controller";

import { SCAN_BATCHES_ROLES } from "../constants/scan-batches.constants";

import "../docs/scan-batches.docs";

const router = Router();

// GET /scan-batches
// Admin: all batches, Manager: assigned project batches, Inspector: own batches
router.get(
  "/",
  authenticate,
  authorize(
    SCAN_BATCHES_ROLES.ADMIN,
    SCAN_BATCHES_ROLES.MANAGER,
    SCAN_BATCHES_ROLES.INSPECTOR,
  ),
  getScanBatchesController,
);

// GET /scan-batches/:id
// Admin: any batch, Manager: assigned project batch, Inspector: own batch
router.get(
  "/:id",
  authenticate,
  authorize(
    SCAN_BATCHES_ROLES.ADMIN,
    SCAN_BATCHES_ROLES.MANAGER,
    SCAN_BATCHES_ROLES.INSPECTOR,
  ),
  getScanBatchByIdController,
);

// POST /scan-batches
// Inspector only: upload a scan batch with related tree scans
router.post(
  "/",
  authenticate,
  authorize(SCAN_BATCHES_ROLES.INSPECTOR),
  createScanBatchController,
);

// DELETE /scan-batches/:id
// Admin only: delete batch only when it has no related tree scans
router.delete(
  "/:id",
  authenticate,
  authorize(SCAN_BATCHES_ROLES.ADMIN),
  deleteScanBatchController,
);

export default router;