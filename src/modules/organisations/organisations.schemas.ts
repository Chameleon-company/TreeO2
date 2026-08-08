import { z } from "zod";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 300;
const GOVERNMENT_ID_MAX_LENGTH = 80;
const STREET_ADDRESS_MAX_LENGTH = 500;
const LOGO_ID_MAX_LENGTH = 100;
const MAX_PAGE_SIZE = 100;

const requiredName = z
	.string()
	.trim()
	.min(1, "Name is required")
	.max(NAME_MAX_LENGTH);

const optionalEmail = z
	.string()
	.trim()
	.email("Contact email must be a valid email address")
	.max(EMAIL_MAX_LENGTH)
	.optional();

const optionalGovernmentId = z
	.string()
	.trim()
	.min(1)
	.max(GOVERNMENT_ID_MAX_LENGTH)
	.optional();

const optionalStreetAddress = z
	.string()
	.trim()
	.min(1)
	.max(STREET_ADDRESS_MAX_LENGTH)
	.optional();

const optionalLogoId = z
	.string()
	.trim()
	.min(1)
	.max(LOGO_ID_MAX_LENGTH)
	.optional();

const optionalText = z.string().trim().min(1).optional();

const optionalForeignKey = z.coerce.number().int().positive().optional();

const organisationIdParams = z.object({
	id: z.coerce.number().int().positive(),
});

export const listOrganisationsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().optional(),
		limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
	}),
});

export const organisationIdSchema = z.object({
	params: organisationIdParams,
});

export const deleteOrganisationSchema = z.object({
	params: organisationIdParams,
});

export const createOrganisationSchema = z.object({
	body: z.object({
		name: requiredName,
		contact_email: optionalEmail,
		government_id: optionalGovernmentId,
		country_id: optionalForeignKey,
		admin_location_id: optionalForeignKey,
		street_address: optionalStreetAddress,
		logo_id: optionalLogoId,
		description: optionalText,
		notes: optionalText,
	}),
});

export const updateOrganisationSchema = z.object({
	params: organisationIdParams,
	body: z
		.object({
			name: requiredName.optional(),
			contact_email: optionalEmail,
			government_id: optionalGovernmentId,
			country_id: optionalForeignKey,
			admin_location_id: optionalForeignKey,
			street_address: optionalStreetAddress,
			logo_id: optionalLogoId,
			description: optionalText,
			notes: optionalText,
			account_active: z.boolean().optional(),
		})
		.refine((value) => Object.keys(value).length > 0, {
			message: "At least one field is required",
		}),
});

export type CreateOrganisationInput = z.infer<
	typeof createOrganisationSchema
>["body"];
export type UpdateOrganisationInput = z.infer<
	typeof updateOrganisationSchema
>["body"];
