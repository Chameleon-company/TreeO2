import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "admin@treeo2.local" },
    update: {},
    create: {
      email: "admin@treeo2.local",
      name: "TreeO2 Admin",
      roleId: adminRole.id,
    },
  });
};

void main()
  .catch((err: unknown) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(() => {
    // ignore error
    prisma.$disconnect().catch(() => {});
  });
