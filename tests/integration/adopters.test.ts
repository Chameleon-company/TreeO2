process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../src/app";

const TOKENS = {
    ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
    MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
    INSPECTOR: process.env.AUTH_DEV_INSPECTOR_TOKEN!,
    FARMER: process.env.AUTH_DEV_FARMER_TOKEN!,
    DEVELOPER: process.env.AUTH_DEV_DEVELOPER_TOKEN!,
};

const api = () =>
  request(app)
    .set("accept", "*/*")
    .set("Content-Type", "application/json")
    .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

describe("Adopters API Integration Tests", () => {
  let createdId: number;
  
  it("POST /adopters - should create adopter", async () => {
    const res = await request(app)
      .post("/adopters")
      .set("accept", "*/*")
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .send({
        name: "Hashini",
        email: "hashini@gmail.com",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data.id");

    createdId = res.body.id;
  });

  it("POST /adopters - should return 400 when name missing", async () => {
    const res = await request(app)
      .post("/adopters")
      .send({
        email: "test@gmail.com",
      })
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
  });

  it("GET /adopters - should return list", async () => {
    const res = await request(app).get("/adopters?page=1&limit=10")
    .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /adopters/:id - should return 404", async () => {
    const res = await request(app).get("/adopters/999999")
    .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
    expect(res.status).toBe(404);
  });

  it("PUT /adopters/:id - should update adopter", async () => {
    const created = await request(app)
      .post("/adopters")
      .send({
        name: "Old",
        email: "old@gmail.com",
      })
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json");

    const res = await request(app)
      .put(`/adopters/${created.body.data.id}`)
      .send({
        name: "Updated",
        email: "updated@gmail.com",
      })
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

    it("DELETE /adopters/:id - should delete adopter", async () => {
    const created = await request(app)
      .post("/adopters")
      .send({
        name: "Delete",
        email: "delete@gmail.com",
      })
      .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
      .set("Content-Type", "application/json");

    const res = await request(app).delete(
      `/adopters/${created.body.data.id}`,
    )
    .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
    .set("Content-Type", "application/json");
    expect(res.status).toBe(200);
  });
 
});