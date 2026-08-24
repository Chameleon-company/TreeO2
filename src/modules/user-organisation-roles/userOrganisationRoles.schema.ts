import { z } from "zod";

const AddUserOrganisationRoleInput = z.object({
	userId: z.number().int().positive(),
	organisationId: z.number().int().positive(),
	roleId: z.number().int().positive(),
});

export const AddUserOrganisationRoleReq = z.object({
	body: AddUserOrganisationRoleInput,
});

export type AddUserOrganisationRoleReq = z.infer<
	typeof AddUserOrganisationRoleReq
>;

const RemoveUserOrganisationRoleInput = z.object({
	userId: z.coerce.number().int().positive(),
	organisationId: z.coerce.number().int().positive(),
	roleId: z.coerce.number().int().positive(),
});

export const RemoveUserOrganisationRoleReq = z.object({
	params: RemoveUserOrganisationRoleInput,
});

export type RemoveUserOrganisationRoleReq = z.infer<
	typeof RemoveUserOrganisationRoleReq
>;
