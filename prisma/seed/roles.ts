import { prisma } from "./client";

export const ROLE_NAMES = [
	"ADMIN",
	"FARMER",
	"MANAGER",
	"INSPECTOR",
	"DEVELOPER",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
export type RoleMap = Record<RoleName, number>;

export const seedRoles = async (): Promise<RoleMap> => {
	const roles = {} as RoleMap;

	for (const name of ROLE_NAMES) {
		const role = await prisma.role.upsert({
			where: { name },
			update: {},
			create: { name },
		});
		roles[name] = role.id;
	}

	return roles;
};
