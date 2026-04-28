import request from "supertest";
import express from "express";
import userRoutes from "../../src/modules/user-management/userManagement.routes";
import { prisma } from "../../src/lib/prisma";

jest.mock("../../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: "ADMIN", projectIds: [101] };
    next();
  },
}));

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

const app = express();
app.use(express.json());
app.use("/users", userRoutes);

describe("User Management API", () => {

  afterEach(() => jest.clearAllMocks());

  it("GET users", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
  });

  it("GET user by id", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      userProjects: [],
    });

    const res = await request(app).get("/users/1");

    expect(res.status).toBe(200);
  });

  it("GET user not found → 404", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/users/999");

    expect(res.status).toBe(404);
  });

  it("CREATE user", async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post("/users")
      .send({
        name: "Test",
        email: "test@test.com",
        roleId: 1,
      });

    expect(res.status).toBe(201);
  });

  it("UPDATE user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      userProjects: [],
    });

    mockPrisma.user.update.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .put("/users/1")
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
  });

  it("DELETE user success", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.treeScan.findFirst.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue({});

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(200);
  });

  it("DELETE user not found → 404", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).delete("/users/999");

    expect(res.status).toBe(404);
  });

  it("DELETE user linked → 409", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.treeScan.findFirst.mockResolvedValue({ id: 1 });

    const res = await request(app).delete("/users/1");

    expect(res.status).toBe(409);
  });
});