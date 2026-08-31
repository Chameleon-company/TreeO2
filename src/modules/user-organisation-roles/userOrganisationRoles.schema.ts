import { z } from "zod";

const AddUserOrganisationRoleBody = z.object({
	userId: z.number().int().positive(),
	organisationId: z.number().int().positive(),
	roleId: z.number().int().positive(),
});

export const AddUserOrganisationRoleReq = z.object({
	body: AddUserOrganisationRoleBody,
});

export type AddUserOrganisationRoleReq = z.infer<
	typeof AddUserOrganisationRoleReq
>;

const RemoveUserOrganisationRoleParams = z.object({
	userId: z.coerce.number().int().positive(),
	organisationId: z.coerce.number().int().positive(),
	roleId: z.coerce.number().int().positive(),
});

export const RemoveUserOrganisationRoleReq = z.object({
	params: RemoveUserOrganisationRoleParams,
});

export type RemoveUserOrganisationRoleReq = z.infer<
	typeof RemoveUserOrganisationRoleReq
>;
