import { z } from "zod";

const TREE_TYPE_TEXT_MAX_LENGTH = 200;

const optionalTrimmedString = z
	.string()
	.trim()
	.min(1)
	.max(TREE_TYPE_TEXT_MAX_LENGTH)
	.optional();

const requiredNameString = z
	.string()
	.trim()
	.min(1, "Name is required")
	.max(TREE_TYPE_TEXT_MAX_LENGTH);

const positiveNumber = z.coerce.number().positive();

const treeTypeIdParams = z.object({
	id: z.coerce.number().int().positive(),
});

export const treeTypeIdSchema = z.object({
	params: treeTypeIdParams,
});

export const createTreeTypeSchema = z.object({
	body: z.object({
		name: requiredNameString,
		key: optionalTrimmedString,
		scientific_name: optionalTrimmedString,
		dry_weight_density: positiveNumber.optional(),
		min_height_m: positiveNumber.optional(),
		max_height_m: positiveNumber.optional(),
		min_diameter_cm: positiveNumber.optional(),
		max_diameter_cm: positiveNumber.optional(),
	}),
});

export const updateTreeTypeSchema = z.object({
	params: treeTypeIdParams,
	body: z
		.object({
			name: requiredNameString.optional(),
			key: optionalTrimmedString,
			scientific_name: optionalTrimmedString,
			dry_weight_density: positiveNumber.optional(),
			min_height_m: positiveNumber.optional(),
			max_height_m: positiveNumber.optional(),
			min_diameter_cm: positiveNumber.optional(),
			max_diameter_cm: positiveNumber.optional(),
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
