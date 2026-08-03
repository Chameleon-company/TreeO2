import { z } from "zod";
import { AccessType } from "@prisma/client";

export const ProjectOrganisationReqBody = z.object({
	projectId: z.number().int().positive(),
	organisationId: z.number().int().positive(),
	accessType: z.nativeEnum(AccessType).default("shared"),
});
export type ProjectOrganisationReqBody = z.infer<
	typeof ProjectOrganisationReqBody
>;

// used for parsing req with body
export const ProjectOrganisationReq = z.object({
	body: ProjectOrganisationReqBody,
});
export type ProjectOrganisationReq = z.infer<typeof ProjectOrganisationReq>;

// used for parsing req with params
// request params returns string, so use z.coerce.number() to convert to number instead of expecting number
export const ProjectOrganisationReqParams = z.object({
	projectId: z.coerce.number().int().positive(),
	organisationId: z.coerce.number().int().positive(),
});
export type ProjectOrganisationReqParams = z.infer<
	typeof ProjectOrganisationReqParams
>;
