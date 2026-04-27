import express from "express";
import request from "supertest";

const originalEnv = { ...process.env };

const prismaMock = {
  $transaction: jest.fn(),
  treeType: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  projectTreeType: {
    count: jest.fn(),
  },
  treeScan: {
    count: jest.fn(),
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

const makeTreeTypeRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  name: "Eucalyptus",
  key: "eucalyptus",
  scientificName: "Eucalyptus globulus",
  dryWeightDensity: 650,
  createdAt: new Date("2026-01-28T10:00:00.000Z"),
  updatedAt: new Date("2026-01-28T10:00:00.000Z"),
  ...overrides,
});

describe("Tree Types API", () => {
  let app: express.Express;

  beforeAll(() => {
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
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(prismaMock),
    );
    prismaMock.projectTreeType.count.mockResolvedValue(0);
    prismaMock.treeScan.count.mockResolvedValue(0);
  });

  describe("GET /tree-types", () => {
    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/tree-types");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 200 with a list of tree types for an authenticated user", async () => {
      prismaMock.treeType.findMany.mockResolvedValue([
        makeTreeTypeRecord({ id: 2, name: "Acacia", key: "acacia" }),
        makeTreeTypeRecord({ id: 1, name: "Eucalyptus", key: "eucalyptus" }),
      ]);

      const response = await request(app)
        .get("/tree-types")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: 2, name: "Acacia", key: "acacia" }),
        expect.objectContaining({
          id: 1,
          name: "Eucalyptus",
          key: "eucalyptus",
        }),
      ]);
    });

    it("should return an empty array when no records exist", async () => {
      prismaMock.treeType.findMany.mockResolvedValue([]);

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
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());

      const response = await request(app)
        .get("/tree-types/1")
        .set(managerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: "Eucalyptus",
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
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/tree-types/999")
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
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(makeTreeTypeRecord());

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "Eucalyptus",
          key: "eucalyptus",
          scientific_name: "Eucalyptus globulus",
          dry_weight_density: 650,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: "Eucalyptus",
          key: "eucalyptus",
          dry_weight_density: 650,
        }),
      );
    });

    it("should create successfully when only name is provided", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(
        makeTreeTypeRecord({
          name: "Acacia",
          key: null,
          scientificName: null,
          dryWeightDensity: 595,
        }),
      );

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "Acacia",
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          name: "Acacia",
          key: null,
          scientific_name: null,
          dry_weight_density: 595,
        }),
      );
      expect(prismaMock.treeType.create).toHaveBeenCalledWith({
        data: {
          name: "Acacia",
          key: undefined,
          scientificName: undefined,
          dryWeightDensity: 595,
        },
      });
    });

    it("should apply default dry_weight_density when omitted", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(
        makeTreeTypeRecord({ dryWeightDensity: 595 }),
      );

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "Acacia",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dry_weight_density).toBe(595);
    });

    it("should return 400 when name is missing", async () => {
      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          key: "eucalyptus",
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
          name: "Eucalyptus",
          dry_weight_density: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 409 for a duplicate key", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(makeTreeTypeRecord());

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "Eucalyptus",
          key: "eucalyptus",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Tree type key already exists");
    });

    it("should return 409 when the database raises a unique violation", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockRejectedValue({ code: "P2002" });

      const response = await request(app)
        .post("/tree-types")
        .set(adminAuthHeader)
        .send({
          name: "Eucalyptus",
          key: "eucalyptus",
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
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.update.mockResolvedValue(
        makeTreeTypeRecord({ dryWeightDensity: 640.5 }),
      );

      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          dry_weight_density: 640.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.dry_weight_density).toBe(640.5);
      expect(prismaMock.treeType.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined,
          key: undefined,
          scientificName: undefined,
          dryWeightDensity: 640.5,
        },
      });
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

    it("should return 404 when the tree type does not exist", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put("/tree-types/999")
        .set(adminAuthHeader)
        .send({
          name: "Updated Eucalyptus",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 for a duplicate key", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.findFirst.mockResolvedValue(
        makeTreeTypeRecord({ id: 2, key: "duplicate-key" }),
      );

      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          key: "duplicate-key",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Tree type key already exists");
    });

    it("should return 409 when update hits a database unique violation", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.update.mockRejectedValue({ code: "P2002" });

      const response = await request(app)
        .put("/tree-types/1")
        .set(adminAuthHeader)
        .send({
          key: "duplicate-key",
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
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.delete.mockResolvedValue(makeTreeTypeRecord());

      const response = await request(app)
        .delete("/tree-types/1")
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Tree type deleted successfully",
      });
      expect(prismaMock.treeType.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return 400 for an invalid id param", async () => {
      const response = await request(app)
        .delete("/tree-types/abc")
        .set(adminAuthHeader);

      expect(response.status).toBe(400);
    });

    it("should return 404 when the tree type does not exist", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete("/tree-types/999")
        .set(adminAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tree type not found");
    });

    it("should return 409 when referenced by project-tree-types", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.count.mockResolvedValue(1);
      prismaMock.treeScan.count.mockResolvedValue(0);

      const response = await request(app)
        .delete("/tree-types/1")
        .set(adminAuthHeader);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Tree type cannot be deleted because it is referenced by other records",
      );
      expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
    });

    it("should return 409 when referenced by tree-scans", async () => {
      prismaMock.projectTreeType.count.mockResolvedValue(0);
      prismaMock.treeScan.count.mockResolvedValue(2);

      const response = await request(app)
        .delete("/tree-types/1")
        .set(adminAuthHeader);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Tree type cannot be deleted because it is referenced by other records",
      );
      expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
    });

    it("should return 409 when the database raises a foreign key violation during delete", async () => {
      prismaMock.$transaction.mockRejectedValue({ code: "P2003" });

      const response = await request(app)
        .delete("/tree-types/1")
        .set(adminAuthHeader);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        "Tree type cannot be deleted because it is referenced by other records",
      );
    });
  });
});
