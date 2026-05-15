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

describe("Partners Integration Tests", () => {
  let partnerId: number;

  beforeEach(async () => {
    // Clean up and create a fresh partner before each test
    await prisma.partner.deleteMany();

    const partner = await prisma.partner.create({
      data: {
        name: "TreeO2-Xpand Foundation",
      },
    });

    partnerId = partner.id;
  });

  afterAll(async () => {
    // Clean up all test data after all tests are done
    await prisma.partner.deleteMany();
    await prisma.$disconnect();
  });

  // Tests for GET /partners endpoint
  describe("GET /partners", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/partners");

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token", async () => {
      const response = await request(app)
        .get("/partners")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 200 for MANAGER token", async () => {
      const response = await request(app)
        .get("/partners")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .get("/partners")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .get("/partners")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for DEVELOPER token", async () => {
      const response = await request(app)
        .get("/partners")
        .set("Authorization", `Bearer ${TOKENS.DEVELOPER}`);

      expect(response.status).toBe(403);
    });
  });

  // Tests for GET /partners/:id endpoint
  describe("GET /partners/:id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get(`/partners/${partnerId}`);

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token when partner exists", async () => {
      const response = await request(app)
        .get(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(partnerId);
    });

    it("should return 200 for MANAGER token when partner exists", async () => {
      const response = await request(app)
        .get(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .get(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 when partner does not exist", async () => {
      const response = await request(app)
        .get("/partners/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid partner id", async () => {
      const response = await request(app)
        .get("/partners/0")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });
  });

  // Tests for POST /partners endpoint
  describe("POST /partners", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).post("/partners").send({
        name: "New Partner",
      });

      expect(response.status).toBe(401);
    });

    it("should return 201 for ADMIN token and create a partner", async () => {
      const response = await request(app)
        .post("/partners")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({
          name: "New Partner",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("New Partner");
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .post("/partners")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send({
          name: "New Partner",
        });

      expect(response.status).toBe(403);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .post("/partners")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          name: "New Partner",
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 when name is empty", async () => {
      const response = await request(app)
        .post("/partners")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 when name is missing", async () => {
      const response = await request(app)
        .post("/partners")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // Tests for PUT /partners/:id endpoint
  describe("PUT /partners/:id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .put(`/partners/${partnerId}`)
        .send({ name: "Updated Partner" });

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token and update the partner", async () => {
      const response = await request(app)
        .put(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated Partner" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Partner");
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .put(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send({ name: "Updated Partner" });

      expect(response.status).toBe(403);
    });

    it("should return 404 when partner does not exist", async () => {
      const response = await request(app)
        .put("/partners/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated Partner" });

      expect(response.status).toBe(404);
    });

    it("should return 400 for empty payload", async () => {
      const response = await request(app)
        .put(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid partner id", async () => {
      const response = await request(app)
        .put("/partners/0")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send({ name: "Updated Partner" });

      expect(response.status).toBe(400);
    });
  });

  // Tests for DELETE /partners/:id endpoint
  describe("DELETE /partners/:id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).delete(`/partners/${partnerId}`);

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token and delete the partner", async () => {
      const response = await request(app)
        .delete(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Partner deleted successfully");
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .delete(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .delete(`/partners/${partnerId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 when partner does not exist", async () => {
      const response = await request(app)
        .delete("/partners/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid partner id", async () => {
      const response = await request(app)
        .delete("/partners/0")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });
  });
});
