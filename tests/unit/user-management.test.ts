import { UserManagementService } from "../../src/modules/user-management/userManagement.service";
import { prisma } from "../../src/lib/prisma";
import { ERROR_CODES } from "../../src/utils/errorCodes";

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    treeScan: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe("UserManagementService - UNIT TESTS", () => {

  beforeEach(() => jest.clearAllMocks());

  // ---------------- GET USERS ----------------
  describe("getUsers", () => {
    it("should return users", async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await UserManagementService.getUsers(
        { id: 1, role: "ADMIN" } as any,
      );

      expect(result).toHaveLength(1);
    });

    it("should throw invalid project id", async () => {
      await expect(
        UserManagementService.getUsers(
          { id: 1, role: "ADMIN" } as any,
          "abc",
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getUserById", () => {
    it("should return user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        userProjects: [],
      });

      const result = await UserManagementService.getUserById(
        { id: 1, role: "ADMIN" } as any,
        "1",
      );

      expect(result.id).toBe(1);
    });

    it("should throw 404", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        UserManagementService.getUserById(
          { id: 1, role: "ADMIN" } as any,
          "999",
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw invalid id", async () => {
      await expect(
        UserManagementService.getUserById(
          { id: 1, role: "ADMIN" } as any,
          "abc",
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ---------------- CREATE ----------------
  describe("createUser", () => {
    it("should create user", async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 1 });

      const result = await UserManagementService.createUser({
        name: "Test",
        email: "test@test.com",
        roleId: 1,
      });

      expect(result.id).toBe(1);
    });

    it("should throw validation error", async () => {
      await expect(
        UserManagementService.createUser({
          name: "",
          email: "",
          roleId: 0,
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_003,
      });
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateUser", () => {
    it("should update user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        userProjects: [],
      });

      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      const result = await UserManagementService.updateUser(
        { id: 1, role: "ADMIN" } as any,
        "1",
        { name: "Updated" },
      );

      expect(result.id).toBe(1);
    });

    it("should throw not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        UserManagementService.updateUser(
          { id: 1, role: "ADMIN" } as any,
          "1",
          { name: "X" },
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteUser", () => {

    it("should delete user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.treeScan.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await UserManagementService.deleteUser("1");

      expect(result).toBe(true);
    });

    it("should throw 404 if not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        UserManagementService.deleteUser("1"),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 409 if linked", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.treeScan.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        UserManagementService.deleteUser("1"),
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("should throw invalid id", async () => {
      await expect(
        UserManagementService.deleteUser("abc"),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});