import { z } from "zod";

const optionalTrimmedString = z.string().trim().min(1).optional();

const positiveDensity = z.coerce.number().positive();

const treeTypeIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const treeTypeIdSchema = z.object({
  params: treeTypeIdParams,
});

export const createTreeTypeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    key: optionalTrimmedString,
    scientific_name: optionalTrimmedString,
    dry_weight_density: positiveDensity.optional(),
  }),
});

export const updateTreeTypeSchema = z.object({
  params: treeTypeIdParams,
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      key: optionalTrimmedString,
      scientific_name: optionalTrimmedString,
      dry_weight_density: positiveDensity.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required",
    }),
});

export const deleteTreeTypeSchema = z.object({
  params: treeTypeIdParams,
});

export type CreateTreeTypeInput = z.infer<typeof createTreeTypeSchema>["body"];
export type UpdateTreeTypeInput = z.infer<typeof updateTreeTypeSchema>["body"];
