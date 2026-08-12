import { prisma } from "./client";
import type { RoleMap } from "./roles";

// Needs role ids from roles.ts and a location from geography.ts.
//
// Ids below are pinned on purpose, not left to insertion order. AUTH_DEV_MODE
// skips authentication, not the foreign key writes that still use these ids
// afterward. For more information, including why, refer to the README in
// this directory: prisma/seed/README.md
// TODO (AUTH05, T2 2026): once the dev bypass looks users up by email instead
// of trusting a hardcoded sub, this can go back to a plain upsert with no
// pinned ids.
export const seedUsers = async (
	roles: RoleMap,
	countryId: number,
	locationId: number,
): Promise<RoleMap> => {
	const userDefs = [
		{
			id: 1,
			role: "ADMIN",
			email: "dev-admin@treeo2.local",
			name: "Maria Amaral",
		},
		{
			id: 2,
			role: "FARMER",
			email: "dev-farmer@treeo2.local",
			name: "Domingos da Costa",
		},
		{
			id: 3,
			role: "MANAGER",
			email: "dev-manager@treeo2.local",
			name: "Jose Fernandes",
		},
		{
			id: 4,
			role: "INSPECTOR",
			email: "dev-inspector@treeo2.local",
			name: "Filomena dos Santos",
		},
		{
			id: 5,
			role: "DEVELOPER",
			email: "dev-developer@treeo2.local",
			name: "Abel Pereira",
		},
	] as const;

	const users = {} as RoleMap;

	for (const def of userDefs) {
		const user = await prisma.user.upsert({
			where: { email: def.email },
			update: {},
			create: {
				id: def.id,
				email: def.email,
				name: def.name,
				roleId: roles[def.role],
				countryId,
				adminLocationId: locationId,
				canSignIn: true,
				accountActive: true,
				dateJoined: new Date("2024-01-20"),
			},
		});
		users[def.role] = user.id;
	}

	await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`;

	return users;
};
