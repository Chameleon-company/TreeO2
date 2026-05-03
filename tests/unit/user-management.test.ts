import { UserManagementService } from "../../src/modules/user-management/userManagement.service";
import { prisma } from "../../src/lib/prisma";

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    treeScan: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe("UserManagementService - UNIT TESTS (FIXED)", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------------- GET USERS ----------------
  describe("getUsers", () => {
    it("should return users", async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await UserManagementService.getUsers({
        id: 1,
        role: "ADMIN",
      });

      expect(result).toHaveLength(1);
    });

    it("should throw invalid project id", async () => {
      await expect(
        UserManagementService.getUsers({ id: 1, role: "ADMIN" }, "abc"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: expect.stringContaining("VAL_002"),
      });
    });
  });

  // ---------------- GET USER BY ID ----------------
  describe("getUserById", () => {
    it("should return user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        userProjects: [],
      });

      const result = await UserManagementService.getUserById(
        { id: 1, role: "ADMIN" },
        "1",
      );

      expect(result.id).toBe(1);
    });

    it("should throw not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        UserManagementService.getUserById({ id: 1, role: "ADMIN" }, "999"),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: expect.stringContaining("DATA_001"),
      });
    });

    it("should throw invalid id", async () => {
      await expect(
        UserManagementService.getUserById({ id: 1, role: "ADMIN" }, "abc"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: expect.stringContaining("VAL_002"),
      });
    });
  });

  // ---------------- CREATE USER ----------------
  describe("createUser", () => {
    it("should create user", async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 1 });

      const result = await UserManagementService.createUser({
        name: "Test",
        email: "test@test.com",
        roleId: 1,
      });

      expect(result.id).toBe(1);
    });

    it("should fail invalid email", async () => {
      await expect(
        UserManagementService.createUser({
          name: "Test",
          email: "invalid",
          roleId: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: expect.stringContaining("VAL_003"),
      });
    });

    it("should throw duplicate email", async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        UserManagementService.createUser({
          name: "Test",
          email: "test@test.com",
          roleId: 1,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: expect.stringContaining("DATA_002"),
      });
    });
  });

  // ---------------- UPDATE USER ----------------
  describe("updateUser", () => {
    it("should update user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        userProjects: [],
      });

      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      const result = await UserManagementService.updateUser(
        { id: 1, role: "ADMIN" },
        "1",
        { name: "Updated" },
      );

      expect(result.id).toBe(1);
    });

    it("should throw not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        UserManagementService.updateUser(
          { id: 1, role: "ADMIN" },
          "1",
          { name: "X" },
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: expect.stringContaining("DATA_001"),
      });
    });
  });

  // ---------------- RBAC ----------------
  describe("RBAC checks", () => {
    it("should block unsupported role", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 3,
        userProjects: [],
      });

      await expect(
        UserManagementService.updateUser(
          { id: 3, role: "UNKNOWN" as any },
          "3",
          { name: "Test" },
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: expect.stringContaining("AUTH_004"),
      });
    });
  });
});