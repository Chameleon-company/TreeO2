// ✅ MUST BE FIRST (before imports)
process.env.NODE_ENV = "test";

import request from "supertest";
import express from "express";

// ✅ MOCK AUTH (bypass 401)
jest.mock("../../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

jest.mock("../../src/middleware/role.middleware", () => ({
  roleMiddleware: () => (req: any, res: any, next: any) => next(),
}));

// ✅ MOCK PRISMA
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

import userRoutes from "../../src/modules/user-management/userManagement.routes";
import { prisma } from "../../src/lib/prisma";

const mockPrisma = prisma as any;

describe("User Management - INTEGRATION TEST", () => {
  const app = express();
  app.use(express.json());
  app.use("/users", userRoutes);

  afterEach(() => jest.clearAllMocks());

  it("GET /users should return 200", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1, name: "John" }]);

    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /users/:id should return user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: "John" });

    const res = await request(app).get("/users/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("POST /users should create user", async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 1, name: "New User" });

    const res = await request(app)
      .post("/users")
      .send({
        name: "New User",
        email: "test@test.com",
        roleId: 1,
      });

    expect(res.status).toBe(201);
  });

  it("PUT /users/:id should update user", async () => {
    mockPrisma.user.update.mockResolvedValue({ id: 1, name: "Updated" });

    const res = await request(app)
      .put("/users/1")
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
  });

  it("DELETE /users/:id should delete user", async () => {
    mockPrisma.treeScan.findFirst.mockResolvedValue(null);
    mockPrisma.user.delete.mockResolvedValue({});

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(200);
  });
});