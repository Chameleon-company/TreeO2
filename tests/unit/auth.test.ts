import { AuthService } from "../../src/modules/auth/auth.service";
import { AuthRepository } from "../../src/modules/auth/auth.repository";

jest.mock("../../src/modules/auth/auth.repository");

const mockRepository = {
  findUserByEmail: jest.fn(),
  findRoleByName: jest.fn(),
  createUser: jest.fn(),
  getRoleModelAvailability: jest.fn().mockReturnValue(true),
};

(AuthRepository as jest.Mock).mockImplementation(() => mockRepository);

describe("AuthService - register", () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
  });

  it("should successfully register a new user", async () => {
    mockRepository.findUserByEmail.mockResolvedValue(null);
    mockRepository.findRoleByName.mockResolvedValue({ id: 1, name: "FARMER" });
    mockRepository.createUser.mockResolvedValue({
      id: 1,
      name: "Test User",
      email: "test@treeo2.com",
      roleId: 1,
    });

    const result = await service.register({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "FARMER",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("test@treeo2.com");
    expect(result.user.role).toBe("FARMER");
  });

  it("should throw 409 if email already exists", async () => {
    mockRepository.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "test@treeo2.com",
    });

    await expect(
      service.register({
        name: "Test User",
        email: "test@treeo2.com",
        password: "Test@1234",
        role: "FARMER",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("should throw 400 if role not found", async () => {
    mockRepository.findUserByEmail.mockResolvedValue(null);
    mockRepository.findRoleByName.mockResolvedValue(null);

    await expect(
      service.register({
        name: "Test User",
        email: "test@treeo2.com",
        password: "Test@1234",
        role: "FARMER",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should not return password hash in response", async () => {
    mockRepository.findUserByEmail.mockResolvedValue(null);
    mockRepository.findRoleByName.mockResolvedValue({ id: 1, name: "FARMER" });
    mockRepository.createUser.mockResolvedValue({
      id: 1,
      name: "Test User",
      email: "test@treeo2.com",
      roleId: 1,
    });

    const result = await service.register({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "FARMER",
    });

    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("password");
  });
});
