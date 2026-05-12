import { NextFunction, Request, Response } from "express";
import {
  partnersService,
  type CreatePartnerInput,
  type UpdatePartnerInput,
} from "./partners.service";

// This controller connects the routes to the service layer.
// It reads incoming request data and sends back the right HTTP response.
// Business logic and database work happens in partners.service.ts, not here.
export class PartnersController {
  // Returns all partners from the database.
  async getAllPartners(_req: Request, res: Response, next: NextFunction) {
    try {
      const partners = await partnersService.getAllPartners();
      return res.status(200).json({
        success: true,
        data: partners,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Reads the partner ID from the URL and returns that specific partner.
  async getPartnerById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const partner = await partnersService.getPartnerById(id);
      return res.status(200).json({
        success: true,
        data: partner,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Reads the request body and passes it to the service to create a new partner.
  async createPartner(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreatePartnerInput;
      const createdPartner = await partnersService.createPartner(payload);
      return res.status(201).json({
        success: true,
        data: createdPartner,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Reads the partner ID from the URL and the updated fields from the body.
  async updatePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const payload = req.body as UpdatePartnerInput;
      const updatedPartner = await partnersService.updatePartner(id, payload);
      return res.status(200).json({
        success: true,
        data: updatedPartner,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Reads the partner ID from the URL and removes that partner from the database.
  async deletePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await partnersService.deletePartner(id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const partnersController = new PartnersController();
