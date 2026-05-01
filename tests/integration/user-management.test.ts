import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import userRoutes from "../../src/modules/user-management/userManagement.routes";
import type { AuthUser } from "../../src/modules/user-management/userManagement.service";

// ---------------- MOCK AUTH ----------------
jest.mock("../../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      id: 1,
      role: "ADMIN",
      projectIds: [101],
    } as AuthUser;

    next();
  },
}));

// ---------------- MOCK PRISMA ----------------
jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue({ id: 1 }),
    },
    treeScan: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
}));

// ---------------- APP ----------------
const app = express();
app.use(express.json());
app.use("/users", userRoutes);

// ---------------- TESTS ----------------
describe("User Management Integration Tests", () => {
  afterEach(() => jest.clearAllMocks());

  it("GET /users → should return 200", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(200);
  });

  it("GET /users/:id → valid response", async () => {
    const res = await request(app).get("/users/1");
    expect([200, 404]).toContain(res.status);
  });

  it("GET /users/:id → invalid id", async () => {
    const res = await request(app).get("/users/abc");
    expect(res.status).toBe(400);
  });

  it("POST /users → should create user (ADMIN)", async () => {
    const res = await request(app).post("/users").send({
      name: "Test User",
      email: "test@test.com",
      roleId: 1,
      projectIds: [101],
    });

    expect(res.status).toBe(201);
  });

  it("POST /users → invalid payload", async () => {
    const res = await request(app).post("/users").send({
      name: "",
      email: "bad",
      roleId: 0,
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("PUT /users/:id → update user", async () => {
    const res = await request(app)
      .put("/users/1")
      .send({ name: "Updated" });

    expect([200, 403, 404]).toContain(res.status);
  });

  it("DELETE /users/:id → delete flow", async () => {
    const res = await request(app).delete("/users/1");

    expect([200, 404, 409]).toContain(res.status);
  });

  it("DELETE /users/:id → invalid id", async () => {
    const res = await request(app).delete("/users/abc");
    expect(res.status).toBe(400);
  });

  it("RBAC → non-admin blocked", async () => {
    jest.resetModules();

    jest.doMock("../../src/middleware/auth.middleware", () => ({
      authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = {
          id: 2,
          role: "INSPECTOR",
          projectIds: [],
        } as AuthUser;

        next();
      },
    }));

    const express = require("express");
    const routes =
      require("../../src/modules/user-management/userManagement.routes").default;

    const testApp = express();
    testApp.use(express.json());
    testApp.use("/users", routes);

    const res = await request(testApp).post("/users").send({
      name: "Blocked User",
      email: "blocked@test.com",
      roleId: 1,
    });

    expect(res.status).toBe(403);
  });
});