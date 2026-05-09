import { Request, Response } from "express";
import * as service from "./adopters.service";

export const listAdopters = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const adopters = await service.listAdopters(
      page,
      limit
    );

    res.json(adopters);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getAdopter = async (
  req: Request,
  res: Response
) => {
  try {
    const adopter = await service.getAdopterById(
      Number(req.params.id)
    );

    if (!adopter) {
      return res.status(404).json({
        error: "Adopter not found",
      });
    }

    res.json(adopter);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const createAdopter = async (
  req: Request,
  res: Response
) => {
  try {
    const adopter = await service.createAdopter(req.body);

    res.status(201).json(adopter);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const updateAdopter = async (
  req: Request,
  res: Response
) => {
  try {
    const adopter = await service.updateAdopter(
      Number(req.params.id),
      req.body
    );

    res.json(adopter);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteAdopter = async (
  req: Request,
  res: Response
) => {
  try {
    await service.deleteAdopter(Number(req.params.id));

    res.json({
      message: "Adopter deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};