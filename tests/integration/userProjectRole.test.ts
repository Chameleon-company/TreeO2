import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../src/app";

const prisma = new PrismaClient();

const TOKENS = {
  ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
  MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
  INSPECTOR: process.env.AUTH_DEV_INSPECTOR_TOKEN!,
  FARMER: process.env.AUTH_DEV_FARMER_TOKEN!,
};

describe("User Project Role Integration Tests", () => {
  let userId: number;
  let projectId: number;
  let roleId: number;
  let countryId: number;
  let locationId: number;

  beforeAll(async () => {
    await prisma.userProjectRole.deleteMany();
    await prisma.user.deleteMany({
      where: { email: "role-test-user@test.com" },
    });
    await prisma.project.deleteMany({
      where: { name: { startsWith: "Role Test Project" } },
    });
    await prisma.location.deleteMany({
      where: { name: "Role Test Location" },
    });
    await prisma.country.deleteMany({
      where: { iso2: "RX" },
    });

    const role = await prisma.role.upsert({
      where: { name: "FARMER" },
      update: {},
      create: { name: "FARMER" },
    });
    roleId = role.id;

    const country = await prisma.country.create({
      data: {
        name: "Role Test Country",
        iso2: "RX",
        iso3: "RXT",
      },
    });
    countryId = country.id;

    const location = await prisma.location.create({
      data: {
        countryId,
        level: 1,
        name: "Role Test Location",
      },
    });
    locationId = location.id;

    const user = await prisma.user.create({
      data: {
        name: "Role Test User",
        email: "role-test-user@test.com",
        roleId,
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    await prisma.userProjectRole.deleteMany({
      where: { userId },
    });

    await prisma.project.deleteMany({
      where: { name: { startsWith: "Role Test Project" } },
    });

    const project = await prisma.project.create({
      data: {
        name: "Role Test Project",
        description: "Project used for user project role endpoint tests",
        countryId,
        adminLocationId: locationId,
        isActive: true,
      },
    });

    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.userProjectRole.deleteMany({
      where: { userId },
    });

    await prisma.user.deleteMany({
      where: { email: "role-test-user@test.com" },
    });

    await prisma.project.deleteMany({
      where: { name: { startsWith: "Role Test Project" } },
    });

    await prisma.location.deleteMany({
      where: { id: locationId },
    });

    await prisma.country.deleteMany({
      where: { id: countryId },
    });

    await prisma.$disconnect();
  });

  describe("GET /user-project-roles", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/user-project-roles");

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token", async () => {
      await prisma.userProjectRole.create({
        data: { userId, projectId, roleId, assignedBy: userId },
      });

      const response = await request(app)
        .get("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 200 for MANAGER token", async () => {
      const response = await request(app)
        .get("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .get("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .get("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /user-project-roles", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(401);
    });

    it("should return 201 for ADMIN token and create a role assignment", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.roleId).toBe(roleId);
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(403);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(403);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`)
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId: 0, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(400);
    });

    it("should return 404 when user does not exist", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId: 999999, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(404);
    });

    it("should return 404 when project does not exist", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId: 999999, roleId, assignedBy: userId });

      expect(response.status).toBe(404);
    });

    it("should return 404 when role does not exist", async () => {
      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId, roleId: 999999, assignedBy: userId });

      expect(response.status).toBe(404);
    });

    it("should return 409 for duplicate role assignment", async () => {
      await prisma.userProjectRole.create({
        data: { userId, projectId, roleId, assignedBy: userId },
      });

      const response = await request(app)
        .post("/user-project-roles")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId, roleId, assignedBy: userId });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /user-project-roles/:user_id/:project_id/:role_id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).delete(
        `/user-project-roles/${userId}/${projectId}/${roleId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token and remove the role assignment", async () => {
      await prisma.userProjectRole.create({
        data: { userId, projectId, roleId, assignedBy: userId },
      });

      const response = await request(app)
        .delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assignment = await prisma.userProjectRole.findUnique({
        where: {
          userId_projectId_roleId: {
            userId,
            projectId,
            roleId,
          },
        },
      });

      expect(assignment).toBeNull();
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid path params", async () => {
      const response = await request(app)
        .delete(`/user-project-roles/abc/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when role assignment does not exist", async () => {
      const response = await request(app)
        .delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });
  });
});
