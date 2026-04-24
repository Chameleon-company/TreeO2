import { UserManagementService } from "../../src/modules/user-management/userManagement.service";
import { prisma } from "../../src/lib/prisma";
process.env.NODE_ENV = "test";
jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    treeScan: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe("UserManagementService - UNIT TESTS", () => {

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ---------------- GET USERS ----------------
  it("should return users list", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1, name: "John" }]);

    const result = await UserManagementService.getUsers();

    expect(result).toHaveLength(1);
  });

  it("should return empty users list", async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await UserManagementService.getUsers();

    expect(result).toEqual([]);
  });

  // ---------------- GET USER BY ID ----------------
  it("should return user by id", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      name: "John",
    });

    const result = await UserManagementService.getUserById("1");

    expect(result?.id).toBe(1);
  });

  it("should return null if user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await UserManagementService.getUserById("999");

    expect(result).toBeNull();
  });

  // ---------------- CREATE USER ----------------
  it("should create user successfully", async () => {
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      name: "New User",
    });

    const result = await UserManagementService.createUser({
      name: "New User",
      email: "test@test.com",
      roleId: 1,
    });

    expect(result.id).toBe(1);
    expect(result.name).toBe("New User");
  });

  // ---------------- UPDATE USER ----------------
  it("should update user successfully", async () => {
    mockPrisma.user.update.mockResolvedValue({
      id: 1,
      name: "Updated User",
    });

    const result = await UserManagementService.updateUser("1", {
      name: "Updated User",
    });

    expect(result?.name).toBe("Updated User");
  });

  it("should return null if update fails", async () => {
    mockPrisma.user.update.mockResolvedValue(null);

    const result = await UserManagementService.updateUser("1", {
      name: "Test",
    });

    expect(result).toBeNull();
  });

  // ---------------- DELETE USER ----------------
  it("should delete user successfully", async () => {
    mockPrisma.treeScan.findFirst.mockResolvedValue(null);
    mockPrisma.user.delete.mockResolvedValue({} as any);

    const result = await UserManagementService.deleteUser("1");

    expect(result).toBe(true);
  });

  
});