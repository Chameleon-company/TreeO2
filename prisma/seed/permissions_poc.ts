/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Seeding RBAC Permissions...");
	const permissions = [
		"projects:create",
		"projects:read",
		"projects:update",
		"projects:delete",
		"tree_types:create",
		"tree_types:read",
		"tree_types:update",
		"tree_scans:create",
		"tree_scans:read",
		"tree_scans:correct",
		"tree_scans:archive",
	];

	for (const p of permissions) {
		await prisma.permission.upsert({
			where: { key: p },
			update: {},
			create: { key: p, description: `Capability to ${p}` },
		});
	}
	console.log("Permissions seeded.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
