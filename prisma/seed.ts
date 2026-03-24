import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  await prisma.user.upsert({
    where: { email: "admin@treeo2.local" },
    update: {},
    create: {
      email: "admin@treeo2.local",
      name: "TreeO2 Admin",
      role: UserRole.ADMIN,
    },
  });
};

void main()
  .catch(async (err: unknown) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
