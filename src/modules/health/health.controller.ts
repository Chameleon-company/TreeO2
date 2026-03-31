import { Request, Response } from "express";
import { HealthService } from "./health.service";

export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  getHealth = (_req: Request, res: Response): void => {
    const result = this.healthService.getHealthStatus();
    res.status(200).json(result);
  };
}
