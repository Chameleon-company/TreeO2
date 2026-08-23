import { z } from "zod";

export const UserProjectRoleReqBody = z.object({
	userId: z.number().int().positive(),
	projectId: z.number().int().positive(),
	roleId: z.number().int().positive(),
});

export const UserProjectRoleReq = z.object({
	body: UserProjectRoleReqBody,
});

export type UserProjectRoleReq = z.infer<typeof UserProjectRoleReq>;

export const UserProjectRoleListQuery = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().default(10),
});

export const UserProjectRoleListReq = z.object({
	query: UserProjectRoleListQuery,
});

export type UserProjectRoleListReq = z.infer<typeof UserProjectRoleListReq>;

export const UserProjectRoleReqParams = z.object({
	user_id: z.coerce.number().int().positive(),
	project_id: z.coerce.number().int().positive(),
	role_id: z.coerce.number().int().positive(),
});

export const UserProjectRoleDeleteReq = z.object({
	params: UserProjectRoleReqParams,
});

export type UserProjectRoleDeleteReq = z.infer<typeof UserProjectRoleDeleteReq>;
