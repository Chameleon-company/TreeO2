import { ERROR_CODES } from "../../src/utils/errorCodes";
import { UserProjectAssignmentService } from "../../src/modules/user-project-assignment/userProjectAssignment.service";

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    userProject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
      this.name = "PrismaClientKnownRequestError";
    }
  }

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      PrismaClientKnownRequestError,
    },
    __mockPrisma: mockPrisma,
  };
});

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client");

describe("UserProjectAssignmentService", () => {
  let service: UserProjectAssignmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserProjectAssignmentService();
  });

  describe("getAssignments", () => {
    it("returns assignments ordered by project and user", async () => {
      const assignments = [{ userId: 1, projectId: 2 }];

      mockPrisma.userProject.findMany.mockResolvedValue(assignments);

      const result = await service.getAssignments();

      expect(mockPrisma.userProject.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: [{ projectId: "asc" }, { userId: "asc" }],
      });
      expect(result).toEqual(assignments);
    });

    it("throws SYS_002 when fetching assignments fails", async () => {
      mockPrisma.userProject.findMany.mockRejectedValue(new Error("DB down"));

      await expect(service.getAssignments()).rejects.toMatchObject({
        statusCode: 500,
        code: ERROR_CODES.SYS_002,
      });
    });
  });

  describe("assignUserToProject", () => {
    it("creates an assignment with valid input", async () => {
      const assignment = { userId: 1, projectId: 2 };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.userProject.findUnique.mockResolvedValue(null);
      mockPrisma.userProject.create.mockResolvedValue(assignment);

      const result = await service.assignUserToProject({
        userId: 1,
        projectId: 2,
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        select: { id: true },
      });
      expect(mockPrisma.userProject.create).toHaveBeenCalledWith({
        data: { userId: 1, projectId: 2 },
        include: expect.any(Object),
      });
      expect(result).toEqual(assignment);
    });

    it("throws VAL_002 for invalid ids", async () => {
      await expect(
        service.assignUserToProject({ userId: 0, projectId: 2 }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("throws DATA_001 when user is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignUserToProject({ userId: 1, projectId: 2 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "User not found",
      });
    });

    it("throws DATA_001 when project is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.assignUserToProject({ userId: 1, projectId: 2 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Project not found",
      });
    });

    it("throws DATA_002 when assignment already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.userProject.findUnique.mockResolvedValue({
        userId: 1,
        projectId: 2,
      });

      await expect(
        service.assignUserToProject({ userId: 1, projectId: 2 }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: ERROR_CODES.DATA_002,
      });
    });
  });

  describe("removeUserFromProject", () => {
    it("removes an existing assignment", async () => {
      mockPrisma.userProject.findUnique.mockResolvedValue({
        userId: 1,
        projectId: 2,
      });
      mockPrisma.userProject.delete.mockResolvedValue({
        userId: 1,
        projectId: 2,
      });

      const result = await service.removeUserFromProject(1, 2);

      expect(mockPrisma.userProject.delete).toHaveBeenCalledWith({
        where: {
          userId_projectId: {
            userId: 1,
            projectId: 2,
          },
        },
      });
      expect(result.message).toBe(
        "User project assignment removed successfully",
      );
    });

    it("throws VAL_002 for invalid path ids", async () => {
      await expect(
        service.removeUserFromProject(Number.NaN, 2),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("throws DATA_001 when assignment is missing", async () => {
      mockPrisma.userProject.findUnique.mockResolvedValue(null);

      await expect(service.removeUserFromProject(1, 2)).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Assignment not found",
      });
    });
  });
});
