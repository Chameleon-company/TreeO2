import { Router } from "express";
import { treeScansController } from "./treeScans.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import {
  createTreeScanSchema,
  listTreeScansSchema,
  treeScanIdSchema,
  updateTreeScanSchema,
} from "./treeScans.schemas";

const router = Router();

/**
 * LIST TREE SCANS
 * ADMIN + MANAGER
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  validateMiddleware(listTreeScansSchema),
  (req, res, next) => {
    void treeScansController.listTreeScans(req, res, next);
  },
);

/**
 * GET TREE SCAN BY ID
 * ADMIN + MANAGER + INSPECTOR SELF
 */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER", "INSPECTOR"]),
  validateMiddleware(treeScanIdSchema),
  (req, res, next) => {
    void treeScansController.getTreeScanById(req, res, next);
  },
);

/**
 * CREATE TREE SCAN
 * INSPECTOR ONLY
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["INSPECTOR"]),
  validateMiddleware(createTreeScanSchema),
  (req, res, next) => {
    void treeScansController.createTreeScan(req, res, next);
  },
);

/**
 * UPDATE TREE SCAN
 * ADMIN ONLY
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validateMiddleware(updateTreeScanSchema),
  (req, res, next) => {
    void treeScansController.updateTreeScan(req, res, next);
  },
);

/**
 * ARCHIVE TREE SCAN
 * ADMIN ONLY
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validateMiddleware(treeScanIdSchema),
  (req, res, next) => {
    void treeScansController.deleteTreeScan(req, res, next);
  },
);

/**
 * RECYCLE FOB SCANS
 * ADMIN + MANAGER
 */
router.post(
  "/recycle/:fobId",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void treeScansController.recycleFob(req, res, next);
  },
);

export default router;
