import request from "supertest";
import express from "express";
import { errorHandler } from "../../src/middleware/errorHandler";
import { securityAuditMiddleware } from "../../src/middleware/securityAudit.middleware";
import { AppError } from "../../src/middleware/errorHandler";
import { ERROR_CODES } from "../../src/utils/errorCodes";

const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockForgotPassword = jest.fn();
const mockResetPassword = jest.fn();
const mockMe = jest.fn();
const mockGetProtectedTest = jest.fn();
const mockGetAdminTest = jest.fn();
const mockGetProjectScopeTest = jest.fn();

jest.mock("../../src/modules/auth/auth.controller", () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    register: mockRegister,
    login: mockLogin,
    logout: mockLogout,
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
    me: mockMe,
    getProtectedTest: mockGetProtectedTest,
    getAdminTest: mockGetAdminTest,
    getProjectScopeTest: mockGetProjectScopeTest,
  })),
}));

import authRoutes from "../../src/modules/auth/auth.routes";

const app = express();
app.use(express.json());
app.use(securityAuditMiddleware);
app.use("/auth", authRoutes);
app.use(errorHandler);

describe("POST /auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 201 for valid registration", async () => {
    mockRegister.mockImplementation((_req: any, res: any) => {
      res.status(201).json({
        success: true,
        user: {
          id: 1,
          name: "Test User",
          email: "test@treeo2.com",
          role: "FARMER",
        },
      });
    });

    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "FARMER",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("test@treeo2.com");
  });

  it("should return 400 for missing fields", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@treeo2.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 400 for weak password", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@treeo2.com",
      password: "weak",
      role: "FARMER",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 400 for invalid role", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "SUPERADMIN",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 409 for duplicate email", async () => {
    mockRegister.mockImplementation(async (_req: any, res: any) => {
      res.status(409).json({
        success: false,
        message: "DATA_002: Duplicate entry",
        code: "DATA_002",
      });
    });

    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "FARMER",
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("should not expose password hash in response", async () => {
    mockRegister.mockImplementation((_req: any, res: any) => {
      res.status(201).json({
        success: true,
        user: {
          id: 1,
          name: "Test User",
          email: "test@treeo2.com",
          role: "FARMER",
        },
      });
    });

    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "test@treeo2.com",
      password: "Test@1234",
      role: "FARMER",
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.user).not.toHaveProperty("password");
  });
});
