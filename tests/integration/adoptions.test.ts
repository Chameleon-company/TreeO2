process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";

import { describe, expect, it, beforeAll } from "@jest/globals";
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

  beforeAll(async () => {
    const adopter = await request(app)
      .post("/adopters")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json")
      .send({
        name: "Integration Adopter",
        email: "integration@gmail.com",
      });

    adopterId = adopter.body.data.id;
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

    adoptionId = res.body.data.id;
  });

  it("POST /adoptions - should return 400 when fob_id missing", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .send({
        adopter_id: adopterId,
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(400);
  });

  it("GET /adoptions - should return list", async () => {
    const res = await request(app)
      .get("/adoptions?page=1&limit=10")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
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
      .send({
        fob_id: "NFC-UPDATED",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /adoptions/:id - should delete adoption", async () => {
    const created = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-DELETE",
        adopted_at: "2026-05-14",
      });

    const res = await request(app)
      .delete(`/adoptions/${created.body.data.id}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
  });

  it("POST /adoptions - should return 401 when no token", async () => {
    const res = await request(app)
      .post("/adoptions")
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-001",
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(401);
  });

  it("POST /adoptions - should return 403 for FARMER", async () => {
    const res = await request(app)
      .post("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.FARMER}`)
      .send({
        adopter_id: adopterId,
        fob_id: "NFC-001",
        adopted_at: "2026-05-14",
      });

    expect(res.status).toBe(403);
  });

  it("GET /adoptions - MANAGER should access list", async () => {
    const res = await request(app)
      .get("/adoptions")
      .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

    expect(res.status).toBe(200);
  });

  it("DELETE cleanup created adoption", async () => {
    const res = await request(app)
      .delete(`/adoptions/${adoptionId}`)
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

    expect(res.status).toBe(200);
  });
});