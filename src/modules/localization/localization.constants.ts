export const LOCALIZATION_CONTEXTS = [
  "API",
  "MOBILE",
  "ADMIN",
  "PUBLIC",
] as const;

export type LocalizationContext = (typeof LOCALIZATION_CONTEXTS)[number];