import type { Request, Response } from "express";
import { z } from "zod";
import {
  type CreateLocalizedStringInput,
  LocalizationService,
  type UpdateLocalizedStringInput,
} from "./localization.service";
import { LOCALIZATION_CONTEXTS } from "./localization.constants";

const listLocalizedStringsQuerySchema = z.object({
  cultureCode: z.string().trim().min(1).max(10).optional(),
  context: z.enum(LOCALIZATION_CONTEXTS).optional(),
});

type ListLocalizedStringsQuery = z.infer<typeof listLocalizedStringsQuerySchema>;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createLocalizedStringSchema = z.object({
  cultureCode: z.string().trim().min(1).max(10),
  stringKey: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1),
  context: z.string().trim().min(1).max(50),
});

const updateLocalizedStringSchema = z
  .object({
    cultureCode: z.string().trim().min(1).max(10).optional(),
    stringKey: z.string().trim().min(1).max(255).optional(),
    value: z.string().trim().min(1).optional(),
    context: z.string().trim().min(1).max(50).optional(),
  })
  .refine(
    (payload) =>
      payload.cultureCode !== undefined ||
      payload.stringKey !== undefined ||
      payload.value !== undefined ||
      payload.context !== undefined,
    { message: "At least one field is required for update" },
  );

export class LocalizationController {
  constructor(
    private readonly localizationService = new LocalizationService(),
  ) {}

  async listLocalizedStrings(_req: Request, res: Response): Promise<void> {
    const filters: ListLocalizedStringsQuery =
      listLocalizedStringsQuerySchema.parse(_req.query);
    const localizedStrings =
      await this.localizationService.listLocalizedStrings(filters);

    res.status(200).json({
      success: true,
      data: localizedStrings,
    });
  }

  async createLocalizedString(req: Request, res: Response): Promise<void> {
    const payload = createLocalizedStringSchema.parse(
      req.body,
    ) as CreateLocalizedStringInput;

    const created =
      await this.localizationService.createLocalizedString(payload);

    res.status(201).json({
      success: true,
      data: created,
    });
  }

  async updateLocalizedString(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateLocalizedStringSchema.parse(
      req.body,
    ) as UpdateLocalizedStringInput;

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
