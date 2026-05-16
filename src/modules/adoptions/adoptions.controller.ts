import { Request, Response, NextFunction } from "express";
import {
  adoptionsService,
  type CreateAdoptionInput,
  type UpdateAdoptionInput,
} from "./adoptions.service";

export class AdoptionsController {
  async createAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateAdoptionInput;

      const result = await adoptionsService.createAdoption(payload);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listAdoptions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await adoptionsService.listAdoptions(page, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAdoptionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await adoptionsService.getAdoptionById(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const payload = req.body as UpdateAdoptionInput;

      const result = await adoptionsService.updateAdoption(id, payload);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await adoptionsService.deleteAdoption(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const adoptionsController = new AdoptionsController();