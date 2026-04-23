import { NextFunction, Request, Response } from "express";
import {
  projectManagementService,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./projectManagement.service";

// Controller class for handling project management HTTP requests.
export class ProjectManagementController {
  // Handles request to retrieve all projects.
  async getAllProjects(_req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectManagementService.getAllProjects();

      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Handles request to retrieve a project by ID.
  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const project = await projectManagementService.getProjectById(id);

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Handles request to create a new project.
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateProjectInput;
      const createdProject = await projectManagementService.createProject(
        payload,
      );

      return res.status(201).json({
        success: true,
        data: createdProject,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Handles request to update an existing project.
  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const payload = req.body as UpdateProjectInput;
      const updatedProject = await projectManagementService.updateProject(
        id,
        payload,
      );

      return res.status(200).json({
        success: true,
        data: updatedProject,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Handles request to delete a project.
  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await projectManagementService.deleteProject(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const projectManagementController = new ProjectManagementController();