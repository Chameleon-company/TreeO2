import { z } from "zod";

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

export const UserProjectRoleReqParams = z.object({
	user_id: z.coerce.number().int().positive(),
	project_id: z.coerce.number().int().positive(),
	role_id: z.coerce.number().int().positive(),
});

export type UserProjectRoleReqParams = z.infer<typeof UserProjectRoleReqParams>;
