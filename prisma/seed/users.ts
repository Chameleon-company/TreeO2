import { prisma } from "./client";
import type { RoleMap } from "./roles";

// Insertion order below determines each User row's autoincrement id, and that id
// is what matters: auth.middleware.ts's AUTH_DEV_MODE bypass hardcodes sub "1".."5"
// to ADMIN, FARMER, MANAGER, INSPECTOR, DEVELOPER, and controllers (e.g.
// treeScans.controller.ts) use req.user.sub directly as a real FK - so these
// ids must exist. Autoincrement drifts the moment anything else touches this
// table (a test run, a signup), so ids are pinned explicitly and the sequence
// is resynced after. If 1-5 are ever taken by unrelated rows, this fails loudly
// (unique constraint) instead of drifting silently. This Doesn't fix the
// middleware's hardcoded-sub design, just makes seeding resilient to it.
// TODO (AUTH05, T2 2026): once the dev bypass looks users up by email instead
// of trusting a hardcoded sub, drop the explicit ids/setval below - plain
// upsert() is enough once id no longer has to match a hardcoded value.
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
