import { z } from "zod";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// POST /user-project-roles body
export const UserProjectRoleReqBody = z.object({
	userId: z.number().int().positive(),
	projectId: z.number().int().positive(),
	roleId: z.number().int().positive(),
});

export type UserProjectRoleReqBody = z.infer<typeof UserProjectRoleReqBody>;

export const UserProjectRoleReq = z.object({
	body: UserProjectRoleReqBody,
});

export type UserProjectRoleReq = z.infer<typeof UserProjectRoleReq>;

// GET /user-project-roles query
export const UserProjectRoleListQuery = z.object({
	page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(MAX_PAGE_SIZE)
		.default(DEFAULT_PAGE_SIZE),
});

export type UserProjectRoleListQuery = z.infer<typeof UserProjectRoleListQuery>;

export const UserProjectRoleListReq = z.object({
	query: UserProjectRoleListQuery,
});

export type UserProjectRoleListReq = z.infer<typeof UserProjectRoleListReq>;

// DELETE /user-project-roles/:user_id/:project_id/:role_id params
export const UserProjectRoleReqParams = z.object({
	user_id: z.coerce.number().int().positive(),
	project_id: z.coerce.number().int().positive(),
	role_id: z.coerce.number().int().positive(),
});

export type UserProjectRoleReqParams = z.infer<typeof UserProjectRoleReqParams>;

export const UserProjectRoleDeleteReq = z.object({
	params: UserProjectRoleReqParams,
});

export type UserProjectRoleDeleteReq = z.infer<typeof UserProjectRoleDeleteReq>;
