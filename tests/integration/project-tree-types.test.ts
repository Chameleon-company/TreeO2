import express from "express";
import request from "supertest";
import { prisma } from "../../src/lib/prisma";

const originalEnv = { ...process.env };

jest.mock("../../src/config/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const createApp = (): express.Express => {
  const projectTreeTypesRoutes = require("../../src/modules/project-tree-types/projectTreeTypes.routes")
    .default as express.Router;
  const { errorHandler } = require("../../src/middleware/errorHandler") as {
    errorHandler: express.ErrorRequestHandler;
  };
  const app = express();
  app.use(express.json());
  app.use("/project-tree-types", projectTreeTypesRoutes);
  app.use(errorHandler);
  return app;
};

const adminAuthHeader = {
  Authorization: "Bearer test-admin-token",
};

const managerAuthHeader = {
  Authorization: "Bearer test-manager-token",
};

const farmerAuthHeader = {
  Authorization: "Bearer test-farmer-token",
};

const suitePrefix = `project-tree-types-api-${Date.now()}`;
let uniqueCounter = 0;

const nextUnique = (label: string): string => {
  uniqueCounter += 1;
  return `${suitePrefix}-${label}-${uniqueCounter}`;
};

describe("Project Tree Types API", () => {
  let app: express.Express;
  const projectIds: number[] = [];
  const treeTypeIds: number[] = [];

  const createProject = async (name?: string) => {
    const project = await prisma.project.create({
      data: {
        name: name ?? nextUnique("project"),
      },
    });

    projectIds.push(project.id);
    return project;
  };

  const createTreeType = async (overrides: {
    name?: string;
    key?: string | null;
    scientificName?: string | null;
    dryWeightDensity?: number;
  } = {}) => {
    const treeType = await prisma.treeType.create({
      data: {
        name: overrides.name ?? nextUnique("tree-type"),
        key: overrides.key === undefined ? nextUnique("tree-key") : overrides.key,
        scientificName:
          overrides.scientificName === undefined
            ? nextUnique("scientific-name")
            : overrides.scientificName,
        dryWeightDensity: overrides.dryWeightDensity ?? 550,
      },
    });

    treeTypeIds.push(treeType.id);
    return treeType;
  };

  const createMapping = async (projectId: number, treeTypeId: number) =>
    prisma.projectTreeType.create({
      data: {
        projectId,
        treeTypeId,
      },
    });

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      DATABASE_URL:
        originalEnv.DATABASE_URL ??
        "postgresql://treeo2_user:treeo2_password@localhost:5432/treeo2?schema=public",
      JWT_SECRET:
        originalEnv.JWT_SECRET ?? "12345678901234567890123456789012",
      AUTH_DEV_MODE: "true",
      AUTH_DEV_ADMIN_TOKEN: "test-admin-token",
      AUTH_DEV_MANAGER_TOKEN: "test-manager-token",
      AUTH_DEV_FARMER_TOKEN: "test-farmer-token",
    };

    app = createApp();
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
    process.env = originalEnv;
  });

  describe("GET /project-tree-types", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/project-tree-types");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 403 for an authenticated role outside Admin/Manager", async () => {
      const response = await request(app)
        .get("/project-tree-types")
        .set(farmerAuthHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 200 for an Admin", async () => {
      const project = await createProject("Northern NSW Reforestation");
      const treeType = await createTreeType({
        name: "Mahogany",
        key: nextUnique("mahogany"),
        scientificName: "Swietenia macrophylla",
        dryWeightDensity: 550,
      });
      await createMapping(project.id, treeType.id);

      const response = await request(app)
        .get("/project-tree-types")
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const matchingMapping = response.body.data.find(
        (item: { project_id: number; tree_type_id: number }) =>
          item.project_id === project.id && item.tree_type_id === treeType.id,
      );

      expect(matchingMapping).toEqual({
        project_id: project.id,
        tree_type_id: treeType.id,
        project: {
          id: project.id,
          name: "Northern NSW Reforestation",
        },
        tree_type: {
          id: treeType.id,
          name: "Mahogany",
          key: treeType.key,
          scientific_name: "Swietenia macrophylla",
          dry_weight_density: 550,
        },
      });
    });

    it("should return 200 for a Manager", async () => {
      const response = await request(app)
        .get("/project-tree-types")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return an empty array for a project filter when no mappings exist", async () => {
      const project = await createProject();

      const response = await request(app)
        .get("/project-tree-types")
        .query({ project_id: project.id })
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it("should apply project_id filtering when provided", async () => {
      const matchingProject = await createProject();
      const otherProject = await createProject();
      const firstTreeType = await createTreeType();
      const secondTreeType = await createTreeType();

      await createMapping(matchingProject.id, firstTreeType.id);
      await createMapping(otherProject.id, secondTreeType.id);

      const response = await request(app)
        .get("/project-tree-types")
        .query({ project_id: matchingProject.id })
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({
          project_id: matchingProject.id,
          tree_type_id: firstTreeType.id,
        }),
      ]);
    });

    it("should return 400 for an invalid project_id query", async () => {
      const response = await request(app)
        .get("/project-tree-types")
        .query({ project_id: "abc" })
        .set(adminAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /project-tree-types", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).post("/project-tree-types").send({
        project_id: 1,
        tree_type_id: 3,
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for a non-admin user", async () => {
      const project = await createProject();
      const treeType = await createTreeType();

      const response = await request(app)
        .post("/project-tree-types")
        .set(managerAuthHeader)
        .send({
          project_id: project.id,
          tree_type_id: treeType.id,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 201 for a valid admin request", async () => {
      const project = await createProject("Northern NSW Reforestation");
      const treeType = await createTreeType({
        name: "Mahogany",
        key: nextUnique("mahogany"),
        scientificName: "Swietenia macrophylla",
        dryWeightDensity: 550,
      });

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: project.id,
          tree_type_id: treeType.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(
        "Tree type assigned to project successfully",
      );
      expect(response.body.data).toEqual({
        project_id: project.id,
        tree_type_id: treeType.id,
        project: {
          id: project.id,
          name: "Northern NSW Reforestation",
        },
        tree_type: {
          id: treeType.id,
          name: "Mahogany",
          key: treeType.key,
          scientific_name: "Swietenia macrophylla",
          dry_weight_density: 550,
        },
      });

      const createdMapping = await prisma.projectTreeType.findUnique({
        where: {
          projectId_treeTypeId: {
            projectId: project.id,
            treeTypeId: treeType.id,
          },
        },
      });

      expect(createdMapping).not.toBeNull();
    });

    it("should return 400 when body fields are missing", async () => {
      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid ids", async () => {
      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 0,
          tree_type_id: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when the project does not exist", async () => {
      const treeType = await createTreeType();

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 999999,
          tree_type_id: treeType.id,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should return 404 when the tree type does not exist", async () => {
      const project = await createProject();

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: project.id,
          tree_type_id: 999999,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 when the mapping already exists", async () => {
      const project = await createProject();
      const treeType = await createTreeType();
      await createMapping(project.id, treeType.id);

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: project.id,
          tree_type_id: treeType.id,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "This tree type is already assigned to the project",
      );
    });
  });

  describe("DELETE /project-tree-types/:project_id/:tree_type_id", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).delete("/project-tree-types/1/3");

      expect(response.status).toBe(401);
    });

    it("should return 403 for a non-admin user", async () => {
      const response = await request(app)
        .delete("/project-tree-types/1/3")
        .set(managerAuthHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 200 for a valid admin delete", async () => {
      const project = await createProject();
      const treeType = await createTreeType();
      await createMapping(project.id, treeType.id);

      const response = await request(app)
        .delete(`/project-tree-types/${project.id}/${treeType.id}`)
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Tree type removed from project successfully",
      });

      const deletedMapping = await prisma.projectTreeType.findUnique({
        where: {
          projectId_treeTypeId: {
            projectId: project.id,
            treeTypeId: treeType.id,
          },
        },
      });

      expect(deletedMapping).toBeNull();
    });

    it("should return 400 for invalid path params", async () => {
      const response = await request(app)
        .delete("/project-tree-types/abc/0")
        .set(adminAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when the mapping is missing", async () => {
      const project = await createProject();
      const treeType = await createTreeType();

      const response = await request(app)
        .delete(`/project-tree-types/${project.id}/${treeType.id}`)
        .set(adminAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project tree type mapping not found");
    });
  });
});
