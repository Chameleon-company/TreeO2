import request from "supertest";
import express from "express";
import userRoutes from "../../src/modules/user-management/userManagement.routes";
import { prisma } from "../../src/lib/prisma";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use("/users", userRoutes);

const generateToken = (user: any) =>
  jwt.sign(user, process.env.JWT_SECRET as string);

describe("User Management Integration Tests", () => {
  let adminToken: string;

  beforeEach(async () => {
    await prisma.treeScan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    const role = await prisma.role.create({
      data: { id: 1, name: "ADMIN" },
    });

    await prisma.user.create({
      data: {
        id: 1,
        name: "Admin",
        email: "admin@test.com",
        roleId: role.id,
      },
    });

    adminToken = generateToken({
      id: 1,
      role: "ADMIN",
      projectIds: [],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /users → 200", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("POST /users → 201", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New User",
        email: "new@test.com",
        roleId: 1,
      });

    expect(res.status).toBe(201);
  });

  it("PUT /users/:id → 200", async () => {
    const res = await request(app)
      .put("/users/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
  });

  it("DELETE /users/:id → 200", async () => {
    const res = await request(app)
      .delete("/users/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("RBAC → inspector blocked", async () => {
    const token = generateToken({
      id: 2,
      role: "INSPECTOR",
      projectIds: [],
    });

    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Blocked",
        email: "blocked@test.com",
        roleId: 1,
      });

    expect(res.status).toBe(403);
  });
});