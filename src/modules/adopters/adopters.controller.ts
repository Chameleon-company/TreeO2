import { Request, Response } from "express";

import * as adopterService from "./adopters.service";
import { error } from "node:console";

interface CreateAdopterBody {
  name?: string;
  email?: string;
}

interface UpdateAdopterBody {
  name?: string;
  email?: string;
}

export const createAdopter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adopterData = req.body as CreateAdopterBody;

    const adopter = await adopterService.createAdopter(adopterData);

    res.status(201).json(adopter);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    // return 400 for validation errors
    if (message === "Name is required") {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const updateAdopter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const body = req.body as UpdateAdopterBody;

    const adopter = await adopterService.updateAdopter(id, body);

    res.status(200).json(adopter);
  } catch (_error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Adopter not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const deleteAdopter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await adopterService.deleteAdopter(id);

    res.status(200).json({
      message: "Adopter deleted successfully",
    });
  } catch (error) {
    const message = "Error while deleting adopter";
    res.status(500).json({
      success: false,
      message,
    });
  }
};
export const listAdopters = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const adopters = await adopterService.listAdopters(page, limit);

    res.status(200).json(adopters);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getAdopterById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const adopter = await adopterService.getAdopterById(id);

    if (!adopter) {
      res.status(404).json({
        message: "Adopter not found",
      });
      return;
    }

    res.status(200).json(adopter);
  } catch (error) {
    const message = "Error while fetching adopter";
    res.status(500).json({
      success: false,
      message,
    });
  }
};