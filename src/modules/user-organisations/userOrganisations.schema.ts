import { Status } from "@prisma/client";
import { z } from "zod";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const ListUserOrganisationQuery = z.object({
	page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(MAX_PAGE_SIZE)
		.default(DEFAULT_PAGE_SIZE),
});

export const ListUserOrganisationReq = z.object({
	query: ListUserOrganisationQuery,
});
export type ListUserOrganisationReq = z.infer<typeof ListUserOrganisationReq>;

const AddUserOrganisationInput = z.object({
	userId: z.number().int().positive(),
	organisationId: z.number().int().positive(),
	status: z.nativeEnum(Status).default("active"),
});

export const AddUserOrganisationReq = z.object({
	body: AddUserOrganisationInput,
});
export type AddUserOrganisationReq = z.infer<typeof AddUserOrganisationReq>;

const UserOrganisationParams = z.object({
	userId: z.coerce.number().int().positive(),
	organisationId: z.coerce.number().int().positive(),
});

const UpdateUserOrganisationBody = z.object({
	status: z.nativeEnum(Status),
});

export const UpdateUserOrganisationReq = z.object({
	params: UserOrganisationParams,
	body: UpdateUserOrganisationBody,
});
export type UpdateUserOrganisationReq = z.infer<
	typeof UpdateUserOrganisationReq
>;

export const DeleteUserOrganisationReq = z.object({
	params: UserOrganisationParams,
});
export type DeleteUserOrganisationReq = z.infer<
	typeof DeleteUserOrganisationReq
>;
