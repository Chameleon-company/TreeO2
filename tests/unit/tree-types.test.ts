const prismaMock = {
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

const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

jest.mock("../../src/config/logger", () => ({
  logger: loggerMock,
}));

import { TreeTypesService } from "../../src/modules/tree-types/treeTypes.service";

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

describe("TreeTypesService", () => {
  let service: TreeTypesService;

  beforeEach(() => {
    service = new TreeTypesService();
    jest.clearAllMocks();
    prismaMock.projectTreeType.count.mockResolvedValue(0);
    prismaMock.treeScan.count.mockResolvedValue(0);
  });

  describe("listTreeTypes", () => {
    it("should return mapped tree types", async () => {
      prismaMock.treeType.findMany.mockResolvedValue([
        makeTreeTypeRecord({ id: 2, name: "Acacia", key: "acacia" }),
      ]);

      const result = await service.listTreeTypes();

      expect(prismaMock.treeType.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([
        {
          id: 2,
          name: "Acacia",
          key: "acacia",
          scientific_name: "Eucalyptus globulus",
          dry_weight_density: 650,
          created_at: "2026-01-28T10:00:00.000Z",
          updated_at: "2026-01-28T10:00:00.000Z",
        },
      ]);
    });

    it("should return an empty array when no records exist", async () => {
      prismaMock.treeType.findMany.mockResolvedValue([]);

      const result = await service.listTreeTypes();

      expect(result).toEqual([]);
    });
  });

  describe("getTreeTypeById", () => {
    it("should return a mapped tree type when found", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());

      const result = await service.getTreeTypeById(1);

      expect(result).toEqual({
        id: 1,
        name: "Eucalyptus",
        key: "eucalyptus",
        scientific_name: "Eucalyptus globulus",
        dry_weight_density: 650,
        created_at: "2026-01-28T10:00:00.000Z",
        updated_at: "2026-01-28T10:00:00.000Z",
      });
    });

    it("should throw when the tree type is missing", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      await expect(service.getTreeTypeById(1)).rejects.toMatchObject({
        statusCode: 404,
        message: "Tree type not found",
      });
    });
  });

  describe("createTreeType", () => {
    it("should create successfully with full payload", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(makeTreeTypeRecord());

      const result = await service.createTreeType({
        name: "Eucalyptus",
        key: "eucalyptus",
        scientific_name: "Eucalyptus globulus",
        dry_weight_density: 650,
      });

      expect(prismaMock.treeType.create).toHaveBeenCalledWith({
        data: {
          name: "Eucalyptus",
          key: "eucalyptus",
          scientificName: "Eucalyptus globulus",
          dryWeightDensity: 650,
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          name: "Eucalyptus",
          key: "eucalyptus",
          dry_weight_density: 650,
        }),
      );
      expect(loggerMock.info).toHaveBeenCalledWith("Tree type created", {
        treeTypeId: 1,
        key: "eucalyptus",
        name: "Eucalyptus",
      });
    });

    it("should create successfully with only the required name", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(
        makeTreeTypeRecord({
          key: null,
          scientificName: null,
          dryWeightDensity: 595,
        }),
      );

      const result = await service.createTreeType({
        name: "Acacia",
      });

      expect(prismaMock.treeType.create).toHaveBeenCalledWith({
        data: {
          name: "Acacia",
          key: undefined,
          scientificName: undefined,
          dryWeightDensity: 595,
        },
      });
      expect(result.dry_weight_density).toBe(595);
    });

    it("should apply the default density when omitted", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(null);
      prismaMock.treeType.create.mockResolvedValue(
        makeTreeTypeRecord({ dryWeightDensity: 595 }),
      );

      await service.createTreeType({
        name: "Acacia",
      });

      expect(prismaMock.treeType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dryWeightDensity: 595,
        }),
      });
    });

    it("should throw a conflict for a duplicate key", async () => {
      prismaMock.treeType.findFirst.mockResolvedValue(makeTreeTypeRecord());

      await expect(
        service.createTreeType({
          name: "Eucalyptus",
          key: "eucalyptus",
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Tree type key already exists",
      });
    });
  });

  describe("updateTreeType", () => {
    it("should update only the provided fields", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.update.mockResolvedValue(
        makeTreeTypeRecord({ dryWeightDensity: 640.5 }),
      );

      const result = await service.updateTreeType(1, {
        dry_weight_density: 640.5,
      });

      expect(prismaMock.treeType.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined,
          key: undefined,
          scientificName: undefined,
          dryWeightDensity: 640.5,
        },
      });
      expect(result.dry_weight_density).toBe(640.5);
    });

    it("should throw when updating a missing record", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTreeType(1, { name: "Updated Eucalyptus" }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Tree type not found",
      });
    });
  });

  describe("deleteTreeType", () => {
    it("should delete successfully when there are no references", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.treeType.delete.mockResolvedValue(makeTreeTypeRecord());

      await service.deleteTreeType(1);

      expect(prismaMock.treeType.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(loggerMock.info).toHaveBeenCalledWith("Tree type deleted", {
        treeTypeId: 1,
        key: "eucalyptus",
        name: "Eucalyptus",
      });
    });

    it("should block delete when referenced by project-tree-types", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.count.mockResolvedValue(1);
      prismaMock.treeScan.count.mockResolvedValue(0);

      await expect(service.deleteTreeType(1)).rejects.toMatchObject({
        statusCode: 409,
        message:
          "Tree type cannot be deleted because it is referenced by other records",
      });
      expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
    });

    it("should block delete when referenced by tree-scans", async () => {
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.count.mockResolvedValue(0);
      prismaMock.treeScan.count.mockResolvedValue(1);

      await expect(service.deleteTreeType(1)).rejects.toMatchObject({
        statusCode: 409,
        message:
          "Tree type cannot be deleted because it is referenced by other records",
      });
      expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
    });
  });
});
