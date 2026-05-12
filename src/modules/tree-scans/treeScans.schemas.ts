import { z } from "zod";
import { TREE_SCAN_LIMITS } from "./treeScans.constants";

// Reusable schemas

const idSchema = z.coerce.number().int().positive();

const optionalPositiveDecimal = z.coerce
    .number()
    .positive()
    .optional();

const latitudeSchema = z
    .number()
    .min(TREE_SCAN_LIMITS.MIN_LATITUDE)
    .max(TREE_SCAN_LIMITS.MAX_LATITUDE);

const longitudeSchema = z
    .number()
    .min(TREE_SCAN_LIMITS.MIN_LONGITUDE)
    .max(TREE_SCAN_LIMITS.MAX_LONGITUDE);

// Create tree scan schema
export const createTreeScanSchema = z.object({
    body: z.object({
        fobId: z
        .string()
        .trim()
        .min(1)
        .max(80),

    projectId: idSchema,

    farmerId: idSchema,

    inspectorId: idSchema,

    speciesId: idSchema,

    estimatedPlantedYear: z.coerce
        .number()
        .int()
        .min(TREE_SCAN_LIMITS.MIN_PLANTED_YEAR)
        .max(new Date().getFullYear()),

    estimatedPlantedMonth: z.coerce
        .number()
        .int()
        .min(TREE_SCAN_LIMITS.MIN_MONTH)
        .max(TREE_SCAN_LIMITS.MAX_MONTH),

    plantedDate: z.coerce
        .date()
        .optional(),

    heightM: optionalPositiveDecimal,

    circumferenceCm: optionalPositiveDecimal,

    diameterCm: optionalPositiveDecimal,

    latitude: latitudeSchema.optional(),

    longitude: longitudeSchema.optional(),

    photoId: z
        .string()
        .uuid()
        .optional(),

    batchId: idSchema.optional(),

    deviceId: z
        .string()
        .trim()
        .max(100)
        .optional(),

    validationNotes: z
        .string()
        .trim()
        .max(5000)
        .optional(),
    }),
});

// Update tree scan schema
export const updateTreeScanSchema = z.object({
    params: z.object({
        id: idSchema,
    }),

    body: z.object({
        fobId: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .optional(),

        projectId: idSchema.optional(),

        farmerId: idSchema.optional(),

        inspectorId: idSchema.optional(),

        speciesId: idSchema.optional(),

        estimatedPlantedYear: z.coerce
            .number()
            .int()
            .min(TREE_SCAN_LIMITS.MIN_PLANTED_YEAR)
            .max(new Date().getFullYear())
            .optional(),

        estimatedPlantedMonth: z.coerce
            .number()
            .int()
            .min(TREE_SCAN_LIMITS.MIN_MONTH)
            .max(TREE_SCAN_LIMITS.MAX_MONTH)
            .optional(),

        plantedDate: z.coerce
            .date()
            .optional(),

        heightM: optionalPositiveDecimal,

        circumferenceCm: optionalPositiveDecimal,

        diameterCm: optionalPositiveDecimal,

        latitude: latitudeSchema.optional(),

        longitude: longitudeSchema.optional(),

        photoId: z
            .string()
            .uuid()
            .optional(),

        batchId: idSchema.optional(),

        deviceId: z
            .string()
            .trim()
            .max(100)
            .optional(),

        isArchived: z.boolean().optional(),

        isCorrected: z.boolean().optional(),

        correctedBy: idSchema.optional(),

        correctionReason: z
            .string()
            .trim()
            .max(5000)
            .optional(),

        isValid: z.boolean().optional(),

        validationNotes: z
            .string()
            .trim()
            .max(5000)
            .optional(),
        })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required for update",
        },
    )
    .refine(
        (data) => {
            if (data.isCorrected) {
            return !!data.correctionReason?.trim();
            }

            return true;
        },
        {
            message:
            "Correction reason is required when correcting scan data",
            path: ["correctionReason"],
        },
    ),
});

// Get by ID params schema
export const treeScanIdSchema = z.object({
    params: z.object({
        id: idSchema,
    }),
});

// List tree scans schema
export const listTreeScansSchema = z.object({
    query: z.object({
        page: z.coerce
        .number()
        .int()
        .positive()
        .default(TREE_SCAN_LIMITS.DEFAULT_PAGE),

        limit: z.coerce
        .number()
        .int()
        .positive()
        .max(TREE_SCAN_LIMITS.MAX_LIMIT)
        .default(TREE_SCAN_LIMITS.DEFAULT_LIMIT),

        projectId: idSchema.optional(),

        farmerId: idSchema.optional(),

        inspectorId: idSchema.optional(),

        speciesId: idSchema.optional(),

        batchId: idSchema.optional(),

        isArchived: z.coerce
        .boolean()
        .optional(),

        isValid: z.coerce
        .boolean()
        .optional(),
    }),
});

// Types
export type CreateTreeScanInput =
    z.infer<typeof createTreeScanSchema>["body"];

export type UpdateTreeScanInput =
    z.infer<typeof updateTreeScanSchema>["body"];

export type ListTreeScansQuery =
    z.infer<typeof listTreeScansSchema>["query"];