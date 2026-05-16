import { Request, Response, NextFunction } from "express";
import {
  adoptionsService,
  type CreateAdoptionInput,
  type UpdateAdoptionInput,
  type ListAdoptionsFilters,
} from "./adoptions.service";

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return parsed;
};

export class AdoptionsController {
  async createAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateAdoptionInput;
      const result = await adoptionsService.createAdoption(payload);

      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async listAdoptions(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: ListAdoptionsFilters = {
        page: parseOptionalNumber(req.query.page) ?? 1,
        limit: parseOptionalNumber(req.query.limit) ?? 10,
        fob_id:
          req.query.fob_id !== undefined ? String(req.query.fob_id) : undefined,
        adopter_id: parseOptionalNumber(req.query.adopter_id),
        adopter:
          req.query.adopter !== undefined
            ? String(req.query.adopter)
            : undefined,
        year: parseOptionalNumber(req.query.year),
      };

      const result = await adoptionsService.listAdoptions(filters);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async getAdoptionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await adoptionsService.getAdoptionById(id);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async updateAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const payload = req.body as UpdateAdoptionInput;

      const result = await adoptionsService.updateAdoption(id, payload);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAdoption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await adoptionsService.deleteAdoption(id);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  }
}

export const adoptionsController = new AdoptionsController();
