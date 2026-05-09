import request from "supertest";
import app from "../../src/app";

describe("Adopters API Integration Tests", () => {
  let createdId: number;

  it("POST /adopters - should create adopter", async () => {
    const res = await request(app)
      .post("/adopters")
      .send({
        name: "Hashini",
        email: "hashini@gmail.com",
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    createdId = res.body.id;
  });

  it("POST /adopters - should return 400 when name missing", async () => {
    const res = await request(app)
      .post("/adopters")
      .send({
        email: "test@gmail.com",
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
  });

  it("GET /adopters - should return list", async () => {
    const res = await request(app).get("/adopters?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /adopters/:id - should return 404", async () => {
    const res = await request(app).get("/adopters/999999");

    expect(res.status).toBe(404);
  });

  it("PUT /adopters/:id - should update adopter", async () => {
    const created = await request(app)
      .post("/adopters")
      .send({
        name: "Old",
        email: "old@gmail.com",
      });

    const res = await request(app)
      .put(`/adopters/${created.body.id}`)
      .send({
        name: "Updated",
        email: "updated@gmail.com",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("DELETE /adopters/:id - should delete adopter", async () => {
    const created = await request(app)
      .post("/adopters")
      .send({
        name: "Delete",
        email: "delete@gmail.com",
      });

    const res = await request(app).delete(
      `/adopters/${created.body.id}`,
    );

    expect(res.status).toBe(200);
  });
});