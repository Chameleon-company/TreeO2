export const LOCALIZATION_CONTEXTS = [
  "API",
  "MOBILE",
  "ADMIN",
  "PUBLIC",
] as const;

export const DEFAULT_LOCALIZATION_CULTURE_CODE = "en-US";

export type LocalizationContext = (typeof LOCALIZATION_CONTEXTS)[number];
