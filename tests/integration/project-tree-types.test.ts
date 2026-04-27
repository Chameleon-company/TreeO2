import express from "express";
import request from "supertest";

process.env.NODE_ENV = "development";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://treeo2_user:treeo2_password@localhost:5432/treeo2?schema=public";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "12345678901234567890123456789012";
process.env.AUTH_DEV_MODE = "true";
process.env.AUTH_DEV_ADMIN_TOKEN = "test-admin-token";
process.env.AUTH_DEV_MANAGER_TOKEN = "test-manager-token";
process.env.AUTH_DEV_FARMER_TOKEN = "test-farmer-token";

const prismaMock = {
  projectTreeType: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  treeType: {
    findUnique: jest.fn(),
  },
};

jest.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

jest.mock("../../src/config/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const projectTreeTypesRoutes = require("../../src/modules/project-tree-types/projectTreeTypes.routes")
  .default as express.Router;
const { errorHandler } = require("../../src/middleware/errorHandler") as {
  errorHandler: express.ErrorRequestHandler;
};

const createApp = (): express.Express => {
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

const makeProjectRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: "Northern NSW Reforestation",
  ...overrides,
});

const makeTreeTypeRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 3,
  name: "Mahogany",
  key: "mahogany",
  scientificName: "Swietenia macrophylla",
  dryWeightDensity: 550,
  ...overrides,
});

const makeProjectTreeTypeRecord = (
  overrides: Partial<Record<string, unknown>> = {},
) => ({
  projectId: 1,
  treeTypeId: 3,
  project: makeProjectRecord(),
  treeType: makeTreeTypeRecord(),
  ...overrides,
});

describe("Project Tree Types API", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
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
    });

    it("should return 200 for an Admin", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([
        makeProjectTreeTypeRecord(),
      ]);

      const response = await request(app)
        .get("/project-tree-types")
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        {
          project_id: 1,
          tree_type_id: 3,
          project: {
            id: 1,
            name: "Northern NSW Reforestation",
          },
          tree_type: {
            id: 3,
            name: "Mahogany",
            key: "mahogany",
            scientific_name: "Swietenia macrophylla",
            dry_weight_density: 550,
          },
        },
      ]);
    });

    it("should return 200 for a Manager", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/project-tree-types")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it("should apply project_id filtering when provided", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/project-tree-types")
        .query({ project_id: 7 })
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(prismaMock.projectTreeType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 7,
          },
        }),
      );
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
      const response = await request(app)
        .post("/project-tree-types")
        .set(managerAuthHeader)
        .send({
          project_id: 1,
          tree_type_id: 3,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 201 for a valid admin request", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.findUnique.mockResolvedValue(null);
      prismaMock.projectTreeType.create.mockResolvedValue(
        makeProjectTreeTypeRecord(),
      );

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 1,
          tree_type_id: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(
        "Tree type assigned to project successfully",
      );
      expect(response.body.data).toEqual({
        project_id: 1,
        tree_type_id: 3,
        project: {
          id: 1,
          name: "Northern NSW Reforestation",
        },
        tree_type: {
          id: 3,
          name: "Mahogany",
          key: "mahogany",
          scientific_name: "Swietenia macrophylla",
          dry_weight_density: 550,
        },
      });
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
      prismaMock.project.findUnique.mockResolvedValue(null);
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 1,
          tree_type_id: 3,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project not found");
    });

    it("should return 404 when the tree type does not exist", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 1,
          tree_type_id: 3,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 when the mapping already exists", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.findUnique.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });

      const response = await request(app)
        .post("/project-tree-types")
        .set(adminAuthHeader)
        .send({
          project_id: 1,
          tree_type_id: 3,
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
      prismaMock.projectTreeType.findUnique.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });
      prismaMock.projectTreeType.delete.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });

      const response = await request(app)
        .delete("/project-tree-types/1/3")
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Tree type removed from project successfully",
      });
    });

    it("should return 400 for invalid path params", async () => {
      const response = await request(app)
        .delete("/project-tree-types/abc/0")
        .set(adminAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when the mapping does not exist", async () => {
      prismaMock.projectTreeType.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete("/project-tree-types/1/3")
        .set(adminAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Project tree type mapping not found");
    });
  });
});
