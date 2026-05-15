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

import { ProjectTreeTypesService } from "../../src/modules/project-tree-types/projectTreeTypes.service";

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

describe("ProjectTreeTypesService", () => {
  let service: ProjectTreeTypesService;

  beforeEach(() => {
    service = new ProjectTreeTypesService();
    jest.clearAllMocks();
  });

  describe("listProjectTreeTypes", () => {
    it("should return mapped project tree type assignments", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([
        makeProjectTreeTypeRecord(),
      ]);

      const result = await service.listProjectTreeTypes({});

      expect(prismaMock.projectTreeType.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          treeType: {
            select: {
              id: true,
              name: true,
              key: true,
              scientificName: true,
              dryWeightDensity: true,
            },
          },
        },
        orderBy: [{ projectId: "asc" }, { treeTypeId: "asc" }],
      });

      expect(result).toEqual([
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

    it("should apply project_id filtering when provided", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([]);

      await service.listProjectTreeTypes({ project_id: 7 });

      expect(prismaMock.projectTreeType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 7,
          },
        }),
      );
    });

    it("should return an empty array when no records exist", async () => {
      prismaMock.projectTreeType.findMany.mockResolvedValue([]);

      const result = await service.listProjectTreeTypes({});

      expect(result).toEqual([]);
    });
  });

  describe("addProjectTreeType", () => {
    it("should create a project tree type mapping successfully", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.findUnique.mockResolvedValue(null);
      prismaMock.projectTreeType.create.mockResolvedValue(
        makeProjectTreeTypeRecord(),
      );

      const result = await service.addProjectTreeType({
        project_id: 1,
        tree_type_id: 3,
      });

      expect(prismaMock.projectTreeType.create).toHaveBeenCalledWith({
        data: {
          projectId: 1,
          treeTypeId: 3,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          treeType: {
            select: {
              id: true,
              name: true,
              key: true,
              scientificName: true,
              dryWeightDensity: true,
            },
          },
        },
      });

      expect(result).toEqual({
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

      expect(loggerMock.info).toHaveBeenCalledWith(
        "Tree type assigned to project",
        {
          projectId: 1,
          treeTypeId: 3,
        },
      );
    });

    it("should throw when the project does not exist", async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());

      await expect(
        service.addProjectTreeType({ project_id: 1, tree_type_id: 3 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Project not found",
      });
    });

    it("should throw when the tree type does not exist", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(null);

      await expect(
        service.addProjectTreeType({ project_id: 1, tree_type_id: 3 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Tree type not found",
      });
    });

    it("should throw a conflict when the mapping already exists", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.findUnique.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });

      await expect(
        service.addProjectTreeType({ project_id: 1, tree_type_id: 3 }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "This tree type is already assigned to the project",
      });
    });

    it("should map a database unique violation to a conflict", async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProjectRecord());
      prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
      prismaMock.projectTreeType.findUnique.mockResolvedValue(null);
      prismaMock.projectTreeType.create.mockRejectedValue({ code: "P2002" });

      await expect(
        service.addProjectTreeType({ project_id: 1, tree_type_id: 3 }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "This tree type is already assigned to the project",
      });
    });
  });

  describe("removeProjectTreeType", () => {
    it("should delete a project tree type mapping successfully", async () => {
      prismaMock.projectTreeType.findUnique.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });
      prismaMock.projectTreeType.delete.mockResolvedValue({
        projectId: 1,
        treeTypeId: 3,
      });

      await service.removeProjectTreeType(1, 3);

      expect(prismaMock.projectTreeType.delete).toHaveBeenCalledWith({
        where: {
          projectId_treeTypeId: {
            projectId: 1,
            treeTypeId: 3,
          },
        },
      });

      expect(loggerMock.info).toHaveBeenCalledWith(
        "Tree type removed from project",
        {
          projectId: 1,
          treeTypeId: 3,
        },
      );
    });

    it("should throw when the mapping does not exist", async () => {
      prismaMock.projectTreeType.findUnique.mockResolvedValue(null);

      await expect(service.removeProjectTreeType(1, 3)).rejects.toMatchObject({
        statusCode: 404,
        message: "Project tree type mapping not found",
      });
    });
  });
});
