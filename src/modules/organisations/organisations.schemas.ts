import { z } from "zod";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 300;
const GOVERNMENT_ID_MAX_LENGTH = 80;
const STREET_ADDRESS_MAX_LENGTH = 500;
const LOGO_ID_MAX_LENGTH = 100;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

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

// request params return strings, so use z.coerce.number() to convert to number
export const OrganisationReqParams = z.object({
	id: z.coerce.number().int().positive(),
});
export type OrganisationReqParams = z.infer<typeof OrganisationReqParams>;

// query values also arrive as strings, so coerce to number
export const ListOrganisationsReqQuery = z.object({
	page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(MAX_PAGE_SIZE)
		.default(DEFAULT_PAGE_SIZE),
});
export type ListOrganisationsReqQuery = z.infer<
	typeof ListOrganisationsReqQuery
>;

export const CreateOrganisationReqBody = z.object({
	name: requiredName,
	contactEmail: optionalEmail,
	governmentId: optionalGovernmentId,
	countryId: optionalForeignKey,
	adminLocationId: optionalForeignKey,
	streetAddress: optionalStreetAddress,
	logoId: optionalLogoId,
	description: optionalText,
	notes: optionalText,
});
export type CreateOrganisationReqBody = z.infer<
	typeof CreateOrganisationReqBody
>;

// accountActive is intentionally excluded: deactivation is only available via DELETE,
// which enforces the active users and active projects guards
export const UpdateOrganisationReqBody = z
	.object({
		name: requiredName.optional(),
		contactEmail: optionalEmail,
		governmentId: optionalGovernmentId,
		countryId: optionalForeignKey,
		adminLocationId: optionalForeignKey,
		streetAddress: optionalStreetAddress,
		logoId: optionalLogoId,
		description: optionalText,
		notes: optionalText,
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});
export type UpdateOrganisationReqBody = z.infer<
	typeof UpdateOrganisationReqBody
>;

// used for parsing req with query
export const ListOrganisationsReq = z.object({
	query: ListOrganisationsReqQuery,
});
export type ListOrganisationsReq = z.infer<typeof ListOrganisationsReq>;

// used for parsing req with params
export const OrganisationIdReq = z.object({
	params: OrganisationReqParams,
});
export type OrganisationIdReq = z.infer<typeof OrganisationIdReq>;

// used for parsing req with body
export const CreateOrganisationReq = z.object({
	body: CreateOrganisationReqBody,
});
export type CreateOrganisationReq = z.infer<typeof CreateOrganisationReq>;

// used for parsing req with params and body
export const UpdateOrganisationReq = z.object({
	params: OrganisationReqParams,
	body: UpdateOrganisationReqBody,
});
export type UpdateOrganisationReq = z.infer<typeof UpdateOrganisationReq>;
