import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in .env before running project-tree-types DB integration tests.",
  );
}

process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "12345678901234567890123456789012";

const describeIfDb =
  process.env.RUN_DB_TESTS === "true" ? describe : describe.skip;

let prisma: typeof import("../../src/lib/prisma")["prisma"];
let ProjectTreeTypesService: typeof import("../../src/modules/project-tree-types/projectTreeTypes.service")["ProjectTreeTypesService"];

if (process.env.RUN_DB_TESTS === "true") {
  ({ prisma } = require("../../src/lib/prisma") as typeof import("../../src/lib/prisma"));
  ({ ProjectTreeTypesService } = require("../../src/modules/project-tree-types/projectTreeTypes.service") as typeof import("../../src/modules/project-tree-types/projectTreeTypes.service"));
}

describeIfDb("Project Tree Types DB integration", () => {
  let service: InstanceType<
    typeof import("../../src/modules/project-tree-types/projectTreeTypes.service")["ProjectTreeTypesService"]
  >;
  const projectIds: number[] = [];
  const treeTypeIds: number[] = [];

  beforeAll(async () => {
    service = new ProjectTreeTypesService();
    await prisma.$connect();
  });

  afterEach(async () => {
    if (projectIds.length > 0 || treeTypeIds.length > 0) {
      await prisma.projectTreeType.deleteMany({
        where: {
          OR: [
            projectIds.length > 0 ? { projectId: { in: projectIds } } : undefined,
            treeTypeIds.length > 0 ? { treeTypeId: { in: treeTypeIds } } : undefined,
          ].filter(Boolean) as Array<
            | { projectId: { in: number[] } }
            | { treeTypeId: { in: number[] } }
          >,
        },
      });
    }

    if (projectIds.length > 0) {
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

  it("enforces project/tree type assignment uniqueness at the database level", async () => {
    const suffix = Date.now();

    const project = await prisma.project.create({
      data: { name: `Project Tree Type Project ${suffix}` },
    });
    projectIds.push(project.id);

    const treeType = await prisma.treeType.create({
      data: {
        name: `Project Tree Type Species ${suffix}`,
        key: `project-tree-type-species-${suffix}`,
      },
    });
    treeTypeIds.push(treeType.id);

    await prisma.projectTreeType.create({
      data: {
        projectId: project.id,
        treeTypeId: treeType.id,
      },
    });

    await expect(
      prisma.projectTreeType.create({
        data: {
          projectId: project.id,
          treeTypeId: treeType.id,
        },
      }),
    ).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("removes an existing project tree type mapping from the real database", async () => {
    const suffix = Date.now();

    const project = await prisma.project.create({
      data: { name: `Project Tree Type Delete Project ${suffix}` },
    });
    projectIds.push(project.id);

    const treeType = await prisma.treeType.create({
      data: {
        name: `Project Tree Type Delete Species ${suffix}`,
        key: `project-tree-type-delete-${suffix}`,
      },
    });
    treeTypeIds.push(treeType.id);

    await prisma.projectTreeType.create({
      data: {
        projectId: project.id,
        treeTypeId: treeType.id,
      },
    });

    await service.removeProjectTreeType(project.id, treeType.id);

    const existingMapping = await prisma.projectTreeType.findUnique({
      where: {
        projectId_treeTypeId: {
          projectId: project.id,
          treeTypeId: treeType.id,
        },
      },
    });

    expect(existingMapping).toBeNull();
  });
});
