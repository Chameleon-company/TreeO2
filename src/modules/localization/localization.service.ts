import { LocalizedString } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import {
  DEFAULT_LOCALIZATION_CULTURE_CODE,
  type LocalizationContext,
} from "./localization.constants";

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
  preferredLanguage?: string;
  stringKeys?: string[];
}

export class LocalizationService {
  private async ensureCultureExists(cultureCode: string): Promise<void> {
    const culture = await prisma.culture.findUnique({
      where: { code: cultureCode },
      select: { code: true },
    });

    if (!culture) {
      throw new AppError(400, ERROR_CODES.VAL_002, "VAL_002");
    }
  }

  async listLocalizedStrings(
    filters: ListLocalizedStringsInput,
  ): Promise<LocalizedString[]> {
    if (filters.preferredLanguage) {
      const preferredLanguage = filters.preferredLanguage;

      const entries = await prisma.localizedString.findMany({
        where: {
          ...(filters.context ? { context: filters.context } : {}),
          ...(filters.stringKeys?.length
            ? {
                stringKey: {
                  in: filters.stringKeys,
                },
              }
            : {}),
          cultureCode: {
            in: [preferredLanguage, DEFAULT_LOCALIZATION_CULTURE_CODE],
          },
        },
        orderBy: [{ stringKey: "asc" }, { cultureCode: "asc" }],
      });

      const localizedByKey = new Map<string, LocalizedString>();

      for (const entry of entries) {
        const key = `${entry.stringKey}:${entry.context}`;
        const existing = localizedByKey.get(key);

        if (!existing) {
          localizedByKey.set(key, entry);
          continue;
        }

        if (
          existing.cultureCode !== preferredLanguage &&
          entry.cultureCode === preferredLanguage
        ) {
          localizedByKey.set(key, entry);
        }
      }

      return Array.from(localizedByKey.values()).sort((a, b) =>
        a.stringKey.localeCompare(b.stringKey) || a.context.localeCompare(b.context),
      );
    }

    const where = {
      ...(filters.context ? { context: filters.context } : {}),
      ...(filters.stringKeys?.length
        ? {
            stringKey: {
              in: filters.stringKeys,
            },
          }
        : {}),
      cultureCode: DEFAULT_LOCALIZATION_CULTURE_CODE,
    };

    return prisma.localizedString.findMany({
      where,
      orderBy: [
        { context: "asc" },
        { stringKey: "asc" },
      ],
    });
  }

  async createLocalizedString(
    payload: CreateLocalizedStringInput,
  ): Promise<LocalizedString> {
    await this.ensureCultureExists(payload.cultureCode);
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

    if (payload.cultureCode) {
      await this.ensureCultureExists(payload.cultureCode);
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
