import { Request, Response, NextFunction } from "express";
import {
  adoptersService,
  type CreateAdopterInput,
  type UpdateAdopterInput,
} from "./adopters.service";

export class AdoptersController {
  async createAdopter(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateAdopterInput;

      const result = await adoptersService.createAdopter(payload);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listAdopters(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await adoptersService.listAdopters(page, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAdopterById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await adoptersService.getAdopterById(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateAdopter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const payload = req.body as UpdateAdopterInput;

      const result = await adoptersService.updateAdopter(id, payload);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAdopter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await adoptersService.deleteAdopter(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const adoptersController = new AdoptersController();
