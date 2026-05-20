import request from "supertest";
const API_URL = "http://localhost:3000";
const ADMIN_TOKEN = "dev-admin-token";

describe("Dashboard Endpoints", () => {
  it("GET /dashboard/totals should return totals by role", async () => {
    const res = await request(API_URL)
      .get("/dashboard/totals")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    if (res.statusCode !== 200) {
      console.log("Response for /dashboard/totals:", res.statusCode, res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("role");
  });

  it("GET /dashboard/tree-counts should return tree counts by role", async () => {
    const res = await request(API_URL)
      .get("/dashboard/tree-counts")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    if (res.statusCode !== 200) {
      console.log(
        "Response for /dashboard/tree-counts:",
        res.statusCode,
        res.body,
      );
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("role");
  });

  it("GET /dashboard/scan-stats should return scan stats by role", async () => {
    const res = await request(API_URL)
      .get("/dashboard/scan-stats")
      .set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    if (res.statusCode !== 200) {
      console.log(
        "Response for /dashboard/scan-stats:",
        res.statusCode,
        res.body,
      );
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("role");
  });
});

