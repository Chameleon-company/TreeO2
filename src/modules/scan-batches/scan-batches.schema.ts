import { z } from "zod";
import {
  SCAN_BATCHES_DEFAULTS,
  SCAN_BATCHES_LIMITS,
  SCAN_BATCHES_MESSAGES,
} from "./scan-batches.constants";

const currentYear = new Date().getFullYear();

const futureDateValidator = (value: string | Date): boolean => {
  const parsedDate = value instanceof Date ? value : new Date(value);
  return (
    !Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() <= Date.now()
  );
};

const optionalPositiveNumber = (max: number) =>
  z.coerce
    .number()
    .positive()
    .max(max, SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT)
    .optional()
    .nullable();

const scanSchema = z.object({
  fob_id: z
    .string()
    .trim()
    .min(1, "fob_id is required")
    .max(SCAN_BATCHES_LIMITS.FOB_ID_MAX_LENGTH),

  farmer_id: z.coerce
    .number()
    .int()
    .positive("farmer_id must be a positive integer"),

  species_id: z.coerce
    .number()
    .int()
    .positive("species_id must be a positive integer"),

  estimated_planted_year: z.coerce
    .number()
    .int()
    .min(
      SCAN_BATCHES_LIMITS.MIN_PLANTED_YEAR,
      SCAN_BATCHES_MESSAGES.INVALID_PLANTED_YEAR,
    )
    .max(currentYear, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_YEAR),

  estimated_planted_month: z.coerce
    .number()
    .int()
    .min(1, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_MONTH)
    .max(12, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_MONTH),

  planted_date: z.coerce
    .date()
    .refine(futureDateValidator, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_DATE)
    .optional()
    .nullable(),

  height_m: optionalPositiveNumber(SCAN_BATCHES_LIMITS.MAX_HEIGHT_M),

  diameter_cm: optionalPositiveNumber(SCAN_BATCHES_LIMITS.MAX_DIAMETER_CM),

  circumference_cm: optionalPositiveNumber(
    SCAN_BATCHES_LIMITS.MAX_CIRCUMFERENCE_CM,
  ),

  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),

  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  photo_id: z
    .string()
    .uuid("photo_id must be a valid UUID")
    .optional()
    .nullable(),

  device_id: z
    .string()
    .trim()
    .max(SCAN_BATCHES_LIMITS.DEVICE_ID_MAX_LENGTH)
    .optional()
    .nullable(),
});

export const createScanBatchSchema = z.object({
  project_id: z.coerce
    .number()
    .int()
    .positive(SCAN_BATCHES_MESSAGES.PROJECT_REQUIRED),

  uploaded_at: z.coerce
    .date()
    .refine(futureDateValidator, "Uploaded date cannot be in the future")
    .optional()
    .nullable(),

  scans: z
    .array(scanSchema)
    .min(1, SCAN_BATCHES_MESSAGES.INVALID_SCANS_ARRAY)
    .max(SCAN_BATCHES_LIMITS.MAX_SCANS_PER_BATCH),
});

export const getScanBatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(SCAN_BATCHES_DEFAULTS.PAGE),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(SCAN_BATCHES_DEFAULTS.MAX_LIMIT)
    .default(SCAN_BATCHES_DEFAULTS.LIMIT),

  project_id: z.coerce.number().int().positive().optional(),

  inspector_id: z.coerce.number().int().positive().optional(),
});

export const scanBatchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(SCAN_BATCHES_MESSAGES.INVALID_ID),
});

export type CreateScanBatchInput = z.infer<typeof createScanBatchSchema>;
export type GetScanBatchesQueryInput = z.infer<
  typeof getScanBatchesQuerySchema
>;
export type ScanBatchIdParamInput = z.infer<typeof scanBatchIdParamSchema>;
