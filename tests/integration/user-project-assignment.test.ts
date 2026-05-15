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
  DEVELOPER: process.env.AUTH_DEV_DEVELOPER_TOKEN!,
};

describe("User Project Assignment Integration Tests", () => {
  let userId: number;
  let projectId: number;
  let countryId: number;
  let locationId: number;

  beforeAll(async () => {
    await prisma.userProject.deleteMany();
    await prisma.user.deleteMany({
      where: { email: "assigned-user@test.com" },
    });
    await prisma.project.deleteMany({
      where: { name: { startsWith: "Assignment Test Project" } },
    });
    await prisma.location.deleteMany({
      where: { name: "Assignment Test Location" },
    });
    await prisma.country.deleteMany({
      where: { iso2: "ZX" },
    });

    const userRole = await prisma.role.upsert({
      where: { name: "FARMER" },
      update: {},
      create: { name: "FARMER" },
    });

    const country = await prisma.country.create({
      data: {
        name: "Assignment Test Country",
        iso2: "ZX",
        iso3: "ZXT",
      },
    });
    countryId = country.id;

    const location = await prisma.location.create({
      data: {
        countryId,
        level: 1,
        name: "Assignment Test Location",
      },
    });
    locationId = location.id;

    const user = await prisma.user.create({
      data: {
        name: "Assigned User",
        email: "assigned-user@test.com",
        roleId: userRole.id,
      },
    });
    userId = user.id;
  });

  beforeEach(async () => {
    await prisma.userProject.deleteMany({
      where: { userId },
    });

    await prisma.project.deleteMany({
      where: { name: { startsWith: "Assignment Test Project" } },
    });

    const project = await prisma.project.create({
      data: {
        name: "Assignment Test Project",
        description: "Project used for assignment endpoint tests",
        countryId,
        adminLocationId: locationId,
        isActive: true,
      },
    });

    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.userProject.deleteMany({
      where: { userId },
    });

    await prisma.user.deleteMany({
      where: { email: "assigned-user@test.com" },
    });

    await prisma.project.deleteMany({
      where: { name: { startsWith: "Assignment Test Project" } },
    });

    await prisma.location.deleteMany({
      where: { id: locationId },
    });

    await prisma.country.deleteMany({
      where: { id: countryId },
    });

    await prisma.$disconnect();
  });

  describe("GET /user-projects", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/user-projects");

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token", async () => {
      await prisma.userProject.create({
        data: { userId, projectId },
      });

      const response = await request(app)
        .get("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 200 for MANAGER token", async () => {
      const response = await request(app)
        .get("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .get("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .get("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for DEVELOPER token", async () => {
      const response = await request(app)
        .get("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.DEVELOPER}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /user-projects", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).post("/user-projects").send({
        userId,
        projectId,
      });

      expect(response.status).toBe(401);
    });

    it("should return 201 for ADMIN token and assign a user to a project", async () => {
      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.projectId).toBe(projectId);
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send({ userId, projectId });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId: 0, projectId });

      expect(response.status).toBe(400);
    });

    it("should return 404 when user does not exist", async () => {
      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId: 999999, projectId });

      expect(response.status).toBe(404);
    });

    it("should return 404 when project does not exist", async () => {
      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId: 999999 });

      expect(response.status).toBe(404);
    });

    it("should return 409 for duplicate assignment", async () => {
      await prisma.userProject.create({
        data: { userId, projectId },
      });

      const response = await request(app)
        .post("/user-projects")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ userId, projectId });

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /user-projects/:user_id/:project_id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).delete(
        `/user-projects/${userId}/${projectId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token and remove the assignment", async () => {
      await prisma.userProject.create({
        data: { userId, projectId },
      });

      const response = await request(app)
        .delete(`/user-projects/${userId}/${projectId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assignment = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      expect(assignment).toBeNull();
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .delete(`/user-projects/${userId}/${projectId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid path params", async () => {
      const response = await request(app)
        .delete(`/user-projects/abc/${projectId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when assignment does not exist", async () => {
      const response = await request(app)
        .delete(`/user-projects/${userId}/${projectId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });
  });
});