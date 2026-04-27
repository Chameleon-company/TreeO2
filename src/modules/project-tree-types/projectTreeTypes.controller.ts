import type { Request, Response } from "express";
import { ProjectTreeTypesService } from "./projectTreeTypes.service";
import type {
  CreateProjectTreeTypeInput,
  ListProjectTreeTypesQuery,
} from "./projectTreeTypes.schemas";

export class ProjectTreeTypesController {
  constructor(
    private readonly projectTreeTypesService = new ProjectTreeTypesService(),
  ) {}

  async listProjectTreeTypes(req: Request, res: Response): Promise<void> {
    const data = await this.projectTreeTypesService.listProjectTreeTypes(
      req.query as unknown as ListProjectTreeTypesQuery,
    );

    res.status(200).json({
      success: true,
      message: "Project tree types fetched successfully",
      data,
    });
  }

  async addProjectTreeType(req: Request, res: Response): Promise<void> {
    const data = await this.projectTreeTypesService.addProjectTreeType(
      req.body as CreateProjectTreeTypeInput,
    );

    res.status(201).json({
      success: true,
      message: "Tree type assigned to project successfully",
      data,
    });
  }

  async removeProjectTreeType(req: Request, res: Response): Promise<void> {
    await this.projectTreeTypesService.removeProjectTreeType(
      Number(req.params.project_id),
      Number(req.params.tree_type_id),
    );

    res.status(200).json({
      success: true,
      message: "Tree type removed from project successfully",
    });
  }
}
