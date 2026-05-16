process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";

import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../src/app";

const TOKENS = {
  ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
  MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
  INSPECTOR: process.env.AUTH_DEV_INSPECTOR_TOKEN!,
  FARMER: process.env.AUTH_DEV_FARMER_TOKEN!,
};

describe("Adoptions API Integration Tests", () => {
  let adopterId: number;
  let adoptionId: number;
  const cleanupAdoptionIds: number[] = [];

  beforeAll(async () => {
    const adopter = await request(app)
      .post("/adopters")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        name: "Integration Adopter",
        email: `integration-${Date.now()}@gmail.com`,
      });

    expect(adopter.status).toBe(201);
    expect(adopter.body).toHaveProperty("data.id");

    adopterId = adopter.body.data.id;
  });

  afterAll(async () => {
    for (const id of cleanupAdoptionIds) {
      await request(app)
        .delete(`/adoptions/${id}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);
    }

    if (adopterId) {
      await request(app)
        .delete(`/adopters/${adopterId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);
    }
  });

  it("POST /adoptions - should create adoption", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-001",
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data.id");
    expect(res.body.data.fobId).toBe("NFC-001");

    adoptionId = res.body.data.id;
    cleanupAdoptionIds.push(adoptionId);
  });

  it("POST /adoptions - should return 400 when fob_id missing", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        adopter_id: adopterId,
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(400);
  });

  it("POST /adoptions - should return 400 for invalid adopted_at format", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-BAD-DATE",
        adopted_at: "14-05-2026",
      });

    expect(res.status).toBe(400);
  });

  it("GET /adoptions - should return list", async () => {
    const res = await request(app)
      .get("/adoptions?page=1&limit=10")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("meta");
  });

  it("GET /adoptions - should filter by fob_id", async () => {
    const res = await request(app)
      .get("/adoptions?fob_id=NFC-001")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /adoptions - should filter by adopter_id", async () => {
    const res = await request(app)
      .get(`/adoptions?adopter_id=${adopterId}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /adoptions - should filter by adopter name", async () => {
    const res = await request(app)
      .get("/adoptions?adopter=Integration")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /adoptions - should filter by year", async () => {
    const res = await request(app)
      .get("/adoptions?year=2026")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /adoptions - should return 400 for invalid page query", async () => {
    const res = await request(app)
      .get("/adoptions?page=abc")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(400);
  });

  it("GET /adoptions/:id - should return adoption by id", async () => {
    const res = await request(app)
      .get(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(adoptionId);
  });

  it("GET /adoptions/:id - should return 404", async () => {
    const res = await request(app)
      .get("/adoptions/999999")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(404);
  });

  it("PUT /adoptions/:id - should update adoption", async () => {
    const res = await request(app)
      .put(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        fob_id: "NFC-UPDATED",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fobId).toBe("NFC-UPDATED");
  });

  it("DELETE /adoptions/:id - should delete adoption", async () => {
    const created = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-DELETE",
        adopted_at: "2026-05-14",
      });

    expect(created.status).toBe(201);
    expect(created.body).toHaveProperty("data.id");

    const res = await request(app)
      .delete(`/adoptions/${created.body.data.id}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);

    const checkDeleted = await request(app)
      .get(`/adoptions/${created.body.data.id}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(checkDeleted.status).toBe(404);
  });

  it("POST /adoptions - should return 401 when no token", async () => {
    const res = await request(app).post("/adoptions").send({
      adopter_id: adopterId,
      fob_id: "NFC-NO-TOKEN",
      adopted_at: "2026-05-14",
    });

    expect(res.status).toBe(401);
  });

  it("GET /adoptions - should return 401 when no token", async () => {
    const res = await request(app).get("/adoptions");

    expect(res.status).toBe(401);
  });

  it("GET /adoptions/:id - should return 401 when no token", async () => {
    const res = await request(app).get(`/adoptions/${adoptionId}`);

    expect(res.status).toBe(401);
  });

  it("PUT /adoptions/:id - should return 401 when no token", async () => {
    const res = await request(app).put(`/adoptions/${adoptionId}`).send({
      fob_id: "NFC-NO-TOKEN-UPDATE",
    });

    expect(res.status).toBe(401);
  });

  it("DELETE /adoptions/:id - should return 401 when no token", async () => {
    const res = await request(app).delete(`/adoptions/${adoptionId}`);

    expect(res.status).toBe(401);
  });

  it("GET /adoptions - MANAGER should access list", async () => {
    const res = await request(app)
      .get("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

    expect(res.status).toBe(200);
  });

  it("GET /adoptions/:id - MANAGER should access details", async () => {
    const res = await request(app)
      .get(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

    expect(res.status).toBe(200);
  });

  it("POST /adoptions - MANAGER should return 403", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-MANAGER",
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(403);
  });

  it("PUT /adoptions/:id - MANAGER should return 403", async () => {
    const res = await request(app)
      .put(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
      .send({
        fob_id: "NFC-MANAGER-UPDATE",
      });

    expect(res.status).toBe(403);
  });

  it("DELETE /adoptions/:id - MANAGER should return 403", async () => {
    const res = await request(app)
      .delete(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

    expect(res.status).toBe(403);
  });

  it("GET /adoptions - INSPECTOR should return 403", async () => {
    const res = await request(app)
      .get("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

    expect(res.status).toBe(403);
  });

  it("GET /adoptions/:id - INSPECTOR should return 403", async () => {
    const res = await request(app)
      .get(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

    expect(res.status).toBe(403);
  });

  it("GET /adoptions - FARMER should return 403", async () => {
    const res = await request(app)
      .get("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.FARMER}`);

    expect(res.status).toBe(403);
  });

  it("GET /adoptions/:id - FARMER should return 403", async () => {
    const res = await request(app)
      .get(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.FARMER}`);

    expect(res.status).toBe(403);
  });
});
