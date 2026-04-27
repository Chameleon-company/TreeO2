import { z } from "zod";
import { LOCALIZATION_CONTEXTS } from "./localization.constants";

const stringKeyListSchema = z
  .union([z.string().trim().min(1), z.array(z.string().trim().min(1))])
  .optional();

const normalizeStringKeys = (raw?: string | string[]): string[] | undefined => {
  if (!raw) {
    return undefined;
  }

  const values = Array.isArray(raw)
    ? raw
    : raw.split(",").map((value) => value.trim());

  const unique = Array.from(new Set(values.filter((value) => value.length > 0)));
  return unique.length > 0 ? unique : undefined;
};

export const listLocalizedStringsQuerySchema = z
  .object({
    cultureCode: z.string().trim().min(1).max(10).optional(),
    context: z.enum(LOCALIZATION_CONTEXTS).optional(),
    preferredLanguage: z.string().trim().min(1).max(10).optional(),
    preferred_language: z.string().trim().min(1).max(10).optional(),
    fallbackLanguage: z.string().trim().min(1).max(10).optional(),
    fallback_language: z.string().trim().min(1).max(10).optional(),
    stringKeys: stringKeyListSchema,
    string_keys: stringKeyListSchema,
  })
  .transform((query) => ({
    cultureCode: query.cultureCode,
    context: query.context,
    preferredLanguage: query.preferredLanguage ?? query.preferred_language,
    fallbackLanguage: query.fallbackLanguage ?? query.fallback_language,
    stringKeys:
      normalizeStringKeys(query.stringKeys) ??
      normalizeStringKeys(query.string_keys),
  }));

export type ListLocalizedStringsQuery = z.infer<
  typeof listLocalizedStringsQuerySchema
>;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createLocalizedStringSchema = z.object({
  cultureCode: z.string().trim().min(1).max(10),
  stringKey: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1),
  context: z.string().trim().min(1).max(50),
});

export const updateLocalizedStringSchema = z
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
