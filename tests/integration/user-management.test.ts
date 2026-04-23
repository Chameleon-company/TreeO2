import request from "supertest";
import express from "express";
import userRoutes from "../../src/modules/user-management/userManagement.routes";
import { prisma } from "../../src/lib/prisma";

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

describe("User Management - INTEGRATION TEST", () => {

  const app = express();
  app.use(express.json());
  app.use("/users", userRoutes);

  afterEach(() => jest.clearAllMocks());

  // GET /users
  it("GET /users should return 200", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1, name: "John" }]);

    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // GET /users/:id
  it("GET /users/:id should return user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: "John" });

    const res = await request(app).get("/users/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  // POST /users
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

  // PUT /users/:id
  it("PUT /users/:id should update user", async () => {
    mockPrisma.user.update.mockResolvedValue({ id: 1, name: "Updated" });

    const res = await request(app)
      .put("/users/1")
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
  });

  // DELETE /users/:id
  it("DELETE /users/:id should delete user", async () => {
    mockPrisma.treeScan.findFirst.mockResolvedValue(null);
    mockPrisma.user.delete.mockResolvedValue({} as any);

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(200);
  });
});