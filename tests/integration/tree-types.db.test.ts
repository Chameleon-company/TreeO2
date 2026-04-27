export {};

const shouldRunDbTests = process.env.RUN_DB_TESTS === "true";

if (shouldRunDbTests) {
  const dotenv = require("dotenv") as typeof import("dotenv");
  dotenv.config();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set before running tree-types DB integration tests.",
    );
  }

  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? "12345678901234567890123456789012";
}

const describeIfDb = shouldRunDbTests ? describe : describe.skip;

let prisma: typeof import("../../src/lib/prisma")["prisma"];
let TreeTypesService: typeof import("../../src/modules/tree-types/treeTypes.service")["TreeTypesService"];

if (shouldRunDbTests) {
  ({ prisma } = require("../../src/lib/prisma") as typeof import("../../src/lib/prisma"));
  ({ TreeTypesService } = require("../../src/modules/tree-types/treeTypes.service") as typeof import("../../src/modules/tree-types/treeTypes.service"));
}

describeIfDb("Tree Types DB integration", () => {
  let service: InstanceType<
    typeof import("../../src/modules/tree-types/treeTypes.service")["TreeTypesService"]
  >;
  const projectIds: number[] = [];
  const treeTypeIds: number[] = [];

  beforeAll(async () => {
    service = new TreeTypesService();
    await prisma.$connect();
  });

  afterEach(async () => {
    if (projectIds.length > 0) {
      await prisma.projectTreeType.deleteMany({
        where: { projectId: { in: projectIds } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: projectIds } },
      });
      projectIds.length = 0;
    }

    if (treeTypeIds.length > 0) {
      await prisma.treeType.deleteMany({
        where: { id: { in: treeTypeIds } },
      });
      treeTypeIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("enforces unique key at the database level", async () => {
    const uniqueKey = `db-unique-${Date.now()}`;

    const firstTreeType = await prisma.treeType.create({
      data: {
        name: "DB Unique Tree Type",
        key: uniqueKey,
      },
    });
    treeTypeIds.push(firstTreeType.id);

    await expect(
      prisma.treeType.create({
        data: {
          name: "Duplicate DB Unique Tree Type",
          key: uniqueKey,
        },
      }),
    ).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("blocks delete when referenced by project-tree-types on a real database", async () => {
    const suffix = Date.now();
    const treeType = await prisma.treeType.create({
      data: {
        name: `Referenced Tree Type ${suffix}`,
        key: `referenced-tree-type-${suffix}`,
      },
    });
    treeTypeIds.push(treeType.id);

    const project = await prisma.project.create({
      data: {
        name: `Referenced Project ${suffix}`,
      },
    });
    projectIds.push(project.id);

    await prisma.projectTreeType.create({
      data: {
        projectId: project.id,
        treeTypeId: treeType.id,
      },
    });

    await expect(service.deleteTreeType(treeType.id)).rejects.toMatchObject({
      statusCode: 409,
      message:
        "Tree type cannot be deleted because it is referenced by other records",
    });

    const existingTreeType = await prisma.treeType.findUnique({
      where: { id: treeType.id },
    });

    expect(existingTreeType).not.toBeNull();
  });
});
