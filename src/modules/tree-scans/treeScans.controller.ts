import type { NextFunction, Request, Response } from "express";
import { treeScansService } from "./treeScans.service";
import type {
  CreateTreeScanInput,
  ListTreeScansQuery,
  UpdateTreeScanInput,
} from "./treeScans.schemas";

export class TreeScansController {
  // Create a new tree scan
  async createTreeScan(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateTreeScanInput;

      const result = await treeScansService.createTreeScan(payload);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // List tree scans with filtering and pagination
  async listTreeScans(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListTreeScansQuery;

      const user = {
        id: Number(req.user?.sub),
        role: String(req.user?.role),
      };

      const result = await treeScansService.listTreeScans(query, user);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get a tree scan by ID
  async getTreeScanById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const user = {
        id: Number(req.user?.sub),
        role: String(req.user?.role),
      };

      const result = await treeScansService.getTreeScanById(id, user);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Update an existing tree scan
  async updateTreeScan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const payload = req.body as UpdateTreeScanInput;

      const changedBy = Number(req.user?.sub);

      const result = await treeScansService.updateTreeScan(
        id,
        payload,
        changedBy,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Archive a tree scan
  async deleteTreeScan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await treeScansService.deleteTreeScan(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Archive all scans linked to a FOB ID
  async recycleFob(req: Request, res: Response, next: NextFunction) {
    try {
      const { fobId } = req.params;

      const result = await treeScansService.recycleFob(fobId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const treeScansController = new TreeScansController();
