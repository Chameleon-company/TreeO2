import { ERROR_CODES } from "../../src/utils/errorCodes";
import { UserProjectRoleService } from "../../src/modules/user-project-roles/userProjectRole.service";

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    userProjectRole: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userProject: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    role: {
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

describe("UserProjectRoleService", () => {
  let service: UserProjectRoleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserProjectRoleService();
  });

  describe("getAssignments", () => {
    it("returns all role assignments ordered by project, user and role for ADMIN", async () => {
      const assignments = [{ userId: 1, projectId: 2, roleId: 3 }];

      mockPrisma.userProjectRole.findMany.mockResolvedValue(assignments);

      const result = await service.getAssignments(1, "ADMIN");

      expect(mockPrisma.userProjectRole.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: [{ projectId: "asc" }, { userId: "asc" }, { roleId: "asc" }],
      });
      expect(result).toEqual(assignments);
    });

    it("returns scoped role assignments for MANAGER", async () => {
      const managerProjects = [{ projectId: 2 }];
      const assignments = [{ userId: 3, projectId: 2, roleId: 1 }];

      mockPrisma.userProject.findMany.mockResolvedValue(managerProjects);
      mockPrisma.userProjectRole.findMany.mockResolvedValue(assignments);

      const result = await service.getAssignments(1, "MANAGER");

      expect(mockPrisma.userProject.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: { projectId: true },
      });

      expect(mockPrisma.userProjectRole.findMany).toHaveBeenCalledWith({
        where: {
          projectId: {
            in: [2],
          },
        },
        include: expect.any(Object),
        orderBy: [{ projectId: "asc" }, { userId: "asc" }, { roleId: "asc" }],
      });

      expect(result).toEqual(assignments);
    });

    it("throws SYS_002 when fetching assignments fails", async () => {
      mockPrisma.userProjectRole.findMany.mockRejectedValue(
        new Error("DB down"),
      );

      await expect(service.getAssignments(1, "ADMIN")).rejects.toMatchObject({
        statusCode: 500,
        code: ERROR_CODES.SYS_002,
      });
    });
  });

  describe("createUserProjectRole", () => {
    it("creates a role assignment with valid input", async () => {
      const record = { userId: 1, projectId: 2, roleId: 3, assignedBy: 1 };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.role.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.userProjectRole.findUnique.mockResolvedValue(null);
      mockPrisma.userProjectRole.create.mockResolvedValue(record);

      const result = await service.createUserProjectRole({
        userId: 1,
        projectId: 2,
        roleId: 3,
        assignedBy: 1,
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        select: { id: true },
      });
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: { id: true },
      });
      expect(mockPrisma.userProjectRole.create).toHaveBeenCalledWith({
        data: { userId: 1, projectId: 2, roleId: 3, assignedBy: 1 },
        include: expect.any(Object),
      });
      expect(result).toEqual(record);
    });

    it("throws VAL_002 for invalid ids", async () => {
      await expect(
        service.createUserProjectRole({
          userId: 0,
          projectId: 1,
          roleId: 1,
          assignedBy: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("throws DATA_001 when user is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createUserProjectRole({
          userId: 1,
          projectId: 2,
          roleId: 3,
          assignedBy: 1,
        }),
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
        service.createUserProjectRole({
          userId: 1,
          projectId: 2,
          roleId: 3,
          assignedBy: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Project not found",
      });
    });

    it("throws DATA_001 when role is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.createUserProjectRole({
          userId: 1,
          projectId: 2,
          roleId: 3,
          assignedBy: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Role not found",
      });
    });

    it("throws DATA_002 when role assignment already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.role.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.userProjectRole.findUnique.mockResolvedValue({
        userId: 1,
        projectId: 2,
        roleId: 3,
      });

      await expect(
        service.createUserProjectRole({
          userId: 1,
          projectId: 2,
          roleId: 3,
          assignedBy: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: ERROR_CODES.DATA_002,
      });
    });
  });

  describe("deleteUserProjectRole", () => {
    it("removes an existing role assignment", async () => {
      mockPrisma.userProjectRole.findUnique.mockResolvedValue({
        userId: 1,
        projectId: 2,
        roleId: 3,
      });
      mockPrisma.userProjectRole.delete.mockResolvedValue({
        userId: 1,
        projectId: 2,
        roleId: 3,
      });

      const result = await service.deleteUserProjectRole(1, 2, 3);

      expect(mockPrisma.userProjectRole.delete).toHaveBeenCalledWith({
        where: {
          userId_projectId_roleId: {
            userId: 1,
            projectId: 2,
            roleId: 3,
          },
        },
      });
      expect(result.message).toBe("User project role removed successfully");
    });

    it("throws VAL_002 for invalid path ids", async () => {
      await expect(
        service.deleteUserProjectRole(Number.NaN, 1, 1),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("throws DATA_001 when role assignment is missing", async () => {
      mockPrisma.userProjectRole.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteUserProjectRole(1, 2, 3),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "User project role not found",
      });
    });
  });
});
