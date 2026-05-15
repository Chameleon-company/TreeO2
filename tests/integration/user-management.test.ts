import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import app from "../../src/app";

const prisma = new PrismaClient();

const sign = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET as string);

const TOKENS = {
  ADMIN: sign({ id: 1, role: "ADMIN" }),
  MANAGER: sign({ id: 2, role: "MANAGER", projectIds: [] }),
  INSPECTOR: sign({ id: 3, role: "INSPECTOR" }),
  FARMER: sign({ id: 4, role: "FARMER" }),
};

describe("User Management Integration Tests", () => {
  let roleId: number;
  let userId: number;

  beforeEach(async () => {
    await prisma.treeScan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    const role = await prisma.role.create({ data: { name: "ADMIN" } });
    roleId = role.id;

    const user = await prisma.user.create({
      data: { name: "Test Admin", email: "admin@test.com", roleId },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.treeScan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.$disconnect();
  });

  // ── GET /users ──────────────────────────────────────────────────────────────
  describe("GET /users", () => {
    it("should return 401 with no token", async () => {
      const res = await request(app).get("/users");
      expect(res.status).toBe(401);
    });

    it("should return 200 for ADMIN", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 200 for MANAGER", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(res.status).toBe(200);
    });

    it("should return 403 for INSPECTOR", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 for FARMER", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(res.status).toBe(403);
    });

    it("should return 400 for non-numeric project query param", async () => {
      const res = await request(app)
        .get("/users?project=abc")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(400);
    });

    it("should return 200 when filtering by valid project id", async () => {
      const res = await request(app)
        .get("/users?project=1")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(200);
    });
  });

  // ── GET /users/:id ──────────────────────────────────────────────────────────
  describe("GET /users/:id", () => {
    it("should return 401 with no token", async () => {
      const res = await request(app).get(`/users/${userId}`);
      expect(res.status).toBe(401);
    });

    it("should return 200 and the user for ADMIN", async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe("admin@test.com");
    });

    it("should return 404 when user does not exist", async () => {
      const res = await request(app)
        .get("/users/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for non-numeric id", async () => {
      const res = await request(app)
        .get("/users/abc")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(400);
    });

    it("should return 403 when INSPECTOR requests another user's profile", async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(res.status).toBe(403);
    });

    it("should return 200 when INSPECTOR requests their own profile", async () => {
      const inspector = await prisma.user.create({
        data: { name: "Inspector", email: "inspector@test.com", roleId },
      });

      const token = sign({ id: inspector.id, role: "INSPECTOR" });

      const res = await request(app)
        .get(`/users/${inspector.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(inspector.id);
    });
  });

  // ── POST /users ─────────────────────────────────────────────────────────────
  describe("POST /users", () => {
    it("should return 401 with no token", async () => {
      const res = await request(app)
        .post("/users")
        .send({ name: "New User", email: "new@test.com", roleId });

      expect(res.status).toBe(401);
    });

    it("should return 403 for MANAGER", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send({ name: "New User", email: "new@test.com", roleId });

      expect(res.status).toBe(403);
    });

    it("should return 403 for INSPECTOR", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({ name: "New User", email: "new@test.com", roleId });

      expect(res.status).toBe(403);
    });

    it("should return 201 and the created user for ADMIN", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "New User", email: "new@test.com", roleId });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("new@test.com");
      expect(res.body.name).toBe("New User");
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "New User", email: "not-an-email", roleId });

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing name", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "", email: "new@test.com", roleId });

      expect(res.status).toBe(400);
    });

    it("should return 409 for duplicate email", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Duplicate", email: "admin@test.com", roleId });

      expect(res.status).toBe(409);
    });

    it("should return 400 when roleId does not exist", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "New User", email: "new@test.com", roleId: 999999 });

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /users/:id ──────────────────────────────────────────────────────────
  describe("PUT /users/:id", () => {
    it("should return 401 with no token", async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
    });

    it("should return 200 and the updated user for ADMIN", async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
    });

    it("should return 403 for INSPECTOR", async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
    });

    it("should return 404 when user does not exist", async () => {
      const res = await request(app)
        .put("/users/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });

    it("should return 400 for non-numeric id", async () => {
      const res = await request(app)
        .put("/users/abc")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /users/:id ───────────────────────────────────────────────────────
  describe("DELETE /users/:id", () => {
    it("should return 401 with no token", async () => {
      const res = await request(app).delete(`/users/${userId}`);
      expect(res.status).toBe(401);
    });

    it("should return 200 and soft-delete the user for ADMIN", async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User deactivated successfully");

      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.accountActive).toBe(false);
      expect(user?.canSignIn).toBe(false);
    });

    it("should return 403 for MANAGER", async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 for INSPECTOR", async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 when user does not exist", async () => {
      const res = await request(app)
        .delete("/users/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for non-numeric id", async () => {
      const res = await request(app)
        .delete("/users/abc")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(res.status).toBe(400);
    });
  });
});