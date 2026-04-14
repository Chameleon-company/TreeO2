import { LocalizedString } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import { type LocalizationContext } from "./localization.constants";

export interface CreateLocalizedStringInput {
  cultureCode: string;
  stringKey: string;
  value: string;
  context: string;
}

export interface UpdateLocalizedStringInput {
  cultureCode?: string;
  stringKey?: string;
  value?: string;
  context?: string;
}

export interface ListLocalizedStringsInput {
  cultureCode?: string;
  context?: LocalizationContext;
}

export class LocalizationService {
  async listLocalizedStrings(
    filters: ListLocalizedStringsInput,
  ): Promise<LocalizedString[]> {
    const where = {
      ...(filters.cultureCode ? { cultureCode: filters.cultureCode } : {}),
      ...(filters.context ? { context: filters.context } : {}),
    };

    return prisma.localizedString.findMany({
      where,
      orderBy: [
        { cultureCode: "asc" },
        { context: "asc" },
        { stringKey: "asc" },
      ],
    });
  }

  async createLocalizedString(
    payload: CreateLocalizedStringInput,
  ): Promise<LocalizedString> {
    return prisma.localizedString.create({ data: payload });
  }

  async updateLocalizedString(
    id: number,
    payload: UpdateLocalizedStringInput,
  ): Promise<LocalizedString> {
    const existing = await prisma.localizedString.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, ERROR_CODES.DATA_001, "DATA_001");
    }

    return prisma.localizedString.update({
      where: { id },
      data: payload,
    });
  }

  async deleteLocalizedString(id: number): Promise<void> {
    const existing = await prisma.localizedString.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, ERROR_CODES.DATA_001, "DATA_001");
    }

    await prisma.localizedString.delete({ where: { id } });
  }
}
