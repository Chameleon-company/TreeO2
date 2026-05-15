import type { Request, Response } from "express";
import { LocalizationService } from "./localization.service";
import {
  createLocalizedStringSchema,
  idParamSchema,
  listLocalizedStringsQuerySchema,
  updateLocalizedStringSchema,
} from "./localization.schemas";

export class LocalizationController {
  constructor(
    private readonly localizationService = new LocalizationService(),
  ) {}

  async listLocalizedStrings(_req: Request, res: Response): Promise<void> {
    const filters = listLocalizedStringsQuerySchema.parse(_req.query);

    const localizedStrings =
      await this.localizationService.listLocalizedStrings(filters);

    res.status(200).json({
      success: true,
      data: localizedStrings,
    });
  }

  async createLocalizedString(req: Request, res: Response): Promise<void> {
    const payload = createLocalizedStringSchema.parse(req.body);

    const created =
      await this.localizationService.createLocalizedString(payload);

    res.status(201).json({
      success: true,
      data: created,
    });
  }

  async updateLocalizedString(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateLocalizedStringSchema.parse(req.body);

    const updated = await this.localizationService.updateLocalizedString(
      id,
      payload,
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  }

  async deleteLocalizedString(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await this.localizationService.deleteLocalizedString(id);

    res.status(200).json({
      success: true,
      message: "Localized string deleted successfully",
    });
  }
}
