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
  const treeTypesRoutes = require("../../src/modules/tree-types/treeTypes.routes")
    .default as express.Router;
  const { errorHandler } = require("../../src/middleware/errorHandler") as {
    errorHandler: express.ErrorRequestHandler;
  };
  const app = express();
  app.use(express.json());
  app.use("/tree-types", treeTypesRoutes);
  app.use(errorHandler);
  return app;
};

const adminAuthHeader = {
  Authorization: "Bearer test-admin-token",
};

const managerAuthHeader = {
  Authorization: "Bearer test-manager-token",
};

const tooLongText = "a".repeat(201);
const suitePrefix = `tree-types-api-${Date.now()}`;
let uniqueCounter = 0;

const nextUnique = (label: string): string => {
  uniqueCounter += 1;
  return `${suitePrefix}-${label}-${uniqueCounter}`;
};

describe("Tree Types API", () => {
  let app: express.Express;
  const projectIds: number[] = [];
  const treeTypeIds: number[] = [];
  const roleIds: number[] = [];
  const userIds: number[] = [];
  const treeScanIds: number[] = [];

  const createTreeType = async (overrides: {
    name?: string;
    key?: string | null;
    scientificName?: string | null;
    dryWeightDensity?: number;
  } = {}) => {
    const treeType = await prisma.treeType.create({
      data: {
        name: overrides.name ?? nextUnique("tree-type"),
        key:
          overrides.key === undefined ? nextUnique("key") : overrides.key,
        scientificName:
          overrides.scientificName === undefined
            ? `${nextUnique("scientific-name")}`
            : overrides.scientificName,
        dryWeightDensity: overrides.dryWeightDensity ?? 650,
      },
    });

    treeTypeIds.push(treeType.id);
    return treeType;
  };

  const createProject = async () => {
    const project = await prisma.project.create({
      data: {
        name: nextUnique("project"),
      },
    });

    projectIds.push(project.id);
    return project;
  };

  const createRole = async (name: string) => {
    const role = await prisma.role.create({
      data: {
        name,
      },
    });

    roleIds.push(role.id);
    return role;
  };

  const createUser = async (roleId: number, label: string) => {
    const user = await prisma.user.create({
      data: {
        name: nextUnique(`${label}-user`),
        email: `${nextUnique(label)}@example.com`,
        roleId,
      },
    });

    userIds.push(user.id);
    return user;
  };

  const createTreeScanReference = async (speciesId: number, projectId: number) => {
    const farmerRole = await createRole(nextUnique("farmer-role"));
    const inspectorRole = await createRole(nextUnique("inspector-role"));
    const farmer = await createUser(farmerRole.id, "farmer");
    const inspector = await createUser(inspectorRole.id, "inspector");

    const treeScan = await prisma.treeScan.create({
      data: {
        fobId: nextUnique("fob"),
        projectId,
        farmerId: farmer.id,
        inspectorId: inspector.id,
        speciesId,
        estimatedPlantedYear: 2024,
        estimatedPlantedMonth: 5,
      },
    });

    treeScanIds.push(treeScan.id);
    return treeScan;
  };

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
    };
    app = createApp();
    await prisma.$connect();
  });

  afterEach(async () => {
    if (treeScanIds.length > 0) {
      await prisma.treeScan.deleteMany({
        where: { id: { in: treeScanIds } },
      });
      treeScanIds.length = 0;
    }

    if (projectIds.length > 0 || treeTypeIds.length > 0) {
      await prisma.projectTreeType.deleteMany({
        where: {
          OR: [
            projectIds.length > 0
              ? { projectId: { in: projectIds } }
              : undefined,
            treeTypeIds.length > 0
              ? { treeTypeId: { in: treeTypeIds } }
              : undefined,
          ].filter(Boolean) as Array<
            | { projectId: { in: number[] } }
            | { treeTypeId: { in: number[] } }
          >,
        },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
      userIds.length = 0;
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

    if (roleIds.length > 0) {
      await prisma.role.deleteMany({
        where: { id: { in: roleIds } },
      });
      roleIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env = originalEnv;
  });

  describe("GET /tree-types", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/tree-types");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 200 with a list of tree types for an authenticated user", async () => {
      const first = await createTreeType({
        name: nextUnique("Acacia"),
        key: nextUnique("acacia-key"),
      });
      const second = await createTreeType({
        name: nextUnique("Eucalyptus"),
        key: nextUnique("eucalyptus-key"),
      });

      const response = await request(app)
        .get("/tree-types")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const matchingTreeTypes = response.body.data.filter(
        (treeType: { id: number }) =>
          treeType.id === first.id || treeType.id === second.id,
      );

      expect(matchingTreeTypes).toEqual([
        expect.objectContaining({ id: first.id, name: first.name, key: first.key }),
        expect.objectContaining({
          id: second.id,
          name: second.name,
          key: second.key,
        }),
      ]);
    });

    it("should return an empty array when no tree type records exist in the test database", async () => {
      const response = await request(app)
        .get("/tree-types")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /tree-types/:id", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/tree-types/1");

      expect(response.status).toBe(401);
    });

    it("should return 200 when the tree type exists", async () => {
      const treeType = await createTreeType({
        name: nextUnique("Eucalyptus"),
        key: nextUnique("eucalyptus-key"),
        scientificName: "Eucalyptus globulus",
        dryWeightDensity: 650,
      });

      const response = await request(app)
        .get(`/tree-types/${treeType.id}`)
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: treeType.id,
          name: treeType.name,
          scientific_name: "Eucalyptus globulus",
          dry_weight_density: 650,
        }),
      );
    });

    it("should return 400 for a non-numeric id", async () => {
      const response = await request(app)
        .get("/tree-types/abc")
        .set(managerAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for id 0", async () => {
      const response = await request(app)
        .get("/tree-types/0")
        .set(managerAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for a negative id", async () => {
      const response = await request(app)
        .get("/tree-types/-1")
        .set(managerAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when the tree type does not exist", async () => {
      const response = await request(app)
        .get("/tree-types/999999")
        .set(managerAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });
  });

  describe("POST /tree-types", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).post("/tree-types").send({
        name: "Eucalyptus",
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for a non-admin authenticated user", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(managerAuthHeader)
        .send({ name: "Eucalyptus" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 201 for an admin with a valid payload", async () => {
      const payload = {
        name: nextUnique("Eucalyptus"),
        key: nextUnique("eucalyptus-key"),
        scientific_name: "Eucalyptus globulus",
        dry_weight_density: 650,
      };

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const createdTreeType = await prisma.treeType.findUnique({
        where: { id: response.body.data.id },
      });

      expect(createdTreeType).not.toBeNull();
      if (createdTreeType) {
        treeTypeIds.push(createdTreeType.id);
      }

      expect(response.body.data).toEqual(
        expect.objectContaining({
          name: payload.name,
          key: payload.key,
          scientific_name: payload.scientific_name,
          dry_weight_density: payload.dry_weight_density,
        }),
      );
    });

    it("should create successfully when only name is provided", async () => {
      const name = nextUnique("Acacia");

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          name,
          key: null,
          scientific_name: null,
          dry_weight_density: 595,
        }),
      );

      const createdTreeType = await prisma.treeType.findUnique({
        where: { id: response.body.data.id },
      });

      expect(createdTreeType).not.toBeNull();
      if (createdTreeType) {
        treeTypeIds.push(createdTreeType.id);
        expect(createdTreeType.dryWeightDensity.toNumber()).toBe(595);
      }
    });

    it("should apply default dry_weight_density when omitted", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: nextUnique("Acacia"),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dry_weight_density).toBe(595);

      const createdTreeType = await prisma.treeType.findUnique({
        where: { id: response.body.data.id },
      });

      if (createdTreeType) {
        treeTypeIds.push(createdTreeType.id);
        expect(createdTreeType.dryWeightDensity.toNumber()).toBe(595);
      }
    });

    it("should return 400 when name is missing", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          key: nextUnique("eucalyptus-key"),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when name is blank", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "   ",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for an invalid dry_weight_density", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: nextUnique("Eucalyptus"),
          dry_weight_density: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when name exceeds the DB length limit", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when key exceeds the DB length limit", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: nextUnique("Eucalyptus"),
          key: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when scientific_name exceeds the DB length limit", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: nextUnique("Eucalyptus"),
          scientific_name: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 409 for a duplicate key", async () => {
      const existingTreeType = await createTreeType({
        name: nextUnique("Existing"),
        key: nextUnique("duplicate-key"),
      });

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: nextUnique("Eucalyptus"),
          key: existingTreeType.key,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Tree type key already exists");
    });
  });

  describe("PUT /tree-types/:id", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).put("/tree-types/1").send({
        name: "Updated Eucalyptus",
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for a non-admin user", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(managerAuthHeader)
        .send({
          name: "Updated Eucalyptus",
        });

      expect(response.status).toBe(403);
    });

    it("should return 200 for a valid partial update by admin", async () => {
      const treeType = await createTreeType();

      const response = await request(app)
        .put(`/tree-types/${treeType.id}`)
        .set(adminAuthHeader)
        .send({
          dry_weight_density: 640.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.dry_weight_density).toBe(640.5);

      const updatedTreeType = await prisma.treeType.findUnique({
        where: { id: treeType.id },
      });

      expect(updatedTreeType?.dryWeightDensity.toNumber()).toBe(640.5);
    });

    it("should return 400 for an invalid id param", async () => {
      const response = await request(app)
        .put("/tree-types/abc")
        .set(adminAuthHeader)
        .send({
          name: "Updated Eucalyptus",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for an empty request body", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid values", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          dry_weight_density: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when updated name exceeds the DB length limit", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          name: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when updated key exceeds the DB length limit", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          key: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when updated scientific_name exceeds the DB length limit", async () => {
      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          scientific_name: tooLongText,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when the tree type does not exist", async () => {
      const response = await request(app)
        .put("/tree-types/999999")
        .set(adminAuthHeader)
        .send({
          name: "Updated Eucalyptus",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 for a duplicate key", async () => {
      const existingTreeType = await createTreeType({
        key: nextUnique("duplicate-key"),
      });
      const targetTreeType = await createTreeType({
        key: nextUnique("target-key"),
      });

      const response = await request(app)
        .put(`/tree-types/${targetTreeType.id}`)
        .set(adminAuthHeader)
        .send({
          key: existingTreeType.key,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Tree type key already exists");
    });
  });

  describe("DELETE /tree-types/:id", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).delete("/tree-types/1");

      expect(response.status).toBe(401);
    });

    it("should return 403 for a non-admin user", async () => {
      const response = await request(app)
        .delete("/tree-types/1")
        .set(managerAuthHeader);

      expect(response.status).toBe(403);
    });

    it("should return success for an admin when the record is deletable", async () => {
      const treeType = await createTreeType();

      const response = await request(app)
        .delete(`/tree-types/${treeType.id}`)
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Tree type deleted successfully",
      });

      const deletedTreeType = await prisma.treeType.findUnique({
        where: { id: treeType.id },
      });

      expect(deletedTreeType).toBeNull();
      const index = treeTypeIds.indexOf(treeType.id);
      if (index >= 0) {
        treeTypeIds.splice(index, 1);
      }
    });

    it("should return 400 for an invalid id param", async () => {
      const response = await request(app)
        .delete("/tree-types/abc")
        .set(adminAuthHeader);

      expect(response.status).toBe(400);
    });

    it("should return 404 when the tree type does not exist", async () => {
      const response = await request(app)
        .delete("/tree-types/999999")
        .set(adminAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 when referenced by project-tree-types", async () => {
      const treeType = await createTreeType();
      const project = await createProject();

      await prisma.projectTreeType.create({
        data: {
          projectId: project.id,
          treeTypeId: treeType.id,
        },
      });

      const response = await request(app)
        .delete(`/tree-types/${treeType.id}`)
        .set(adminAuthHeader);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Tree type cannot be deleted because it is referenced by other records",
      );
    });

    it("should return 409 when referenced by tree-scans", async () => {
      const treeType = await createTreeType();
      const project = await createProject();

      await createTreeScanReference(treeType.id, project.id);

      const response = await request(app)
        .delete(`/tree-types/${treeType.id}`)
        .set(adminAuthHeader);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Tree type cannot be deleted because it is referenced by other records",
      );
    });
  });
});
