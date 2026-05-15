import type { Request, Response } from "express";
import { TreeTypesService } from "./treeTypes.service";
import type {
  CreateTreeTypeInput,
  UpdateTreeTypeInput,
} from "./treeTypes.schemas";

export class TreeTypesController {
  constructor(private readonly treeTypesService = new TreeTypesService()) {}

  async listTreeTypes(_req: Request, res: Response): Promise<void> {
    const data = await this.treeTypesService.listTreeTypes();

    res.status(200).json({
      success: true,
      message: "Tree types fetched successfully",
      data,
    });
  }

  async getTreeTypeById(req: Request, res: Response): Promise<void> {
    const data = await this.treeTypesService.getTreeTypeById(
      Number(req.params.id),
    );

    res.status(200).json({
      success: true,
      message: "Tree type fetched successfully",
      data,
    });
  }

  async createTreeType(req: Request, res: Response): Promise<void> {
    const data = await this.treeTypesService.createTreeType(
      req.body as CreateTreeTypeInput,
    );

    res.status(201).json({
      success: true,
      message: "Tree type created successfully",
      data,
    });
  }

  async updateTreeType(req: Request, res: Response): Promise<void> {
    const data = await this.treeTypesService.updateTreeType(
      Number(req.params.id),
      req.body as UpdateTreeTypeInput,
    );

    res.status(200).json({
      success: true,
      message: "Tree type updated successfully",
      data,
    });
  }

  async deleteTreeType(req: Request, res: Response): Promise<void> {
    await this.treeTypesService.deleteTreeType(Number(req.params.id));

    res.status(200).json({
      success: true,
      message: "Tree type deleted successfully",
    });
  }
}
