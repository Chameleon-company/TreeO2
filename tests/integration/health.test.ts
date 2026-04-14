import request from "supertest";
import express from "express";
import healthRoutes from "../../src/modules/health/health.routes";

describe("Health API", () => {
    const app = express();

    app.use(express.json());
    app.use("/health", healthRoutes);

    it("should return 200 for GET /health", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
    });

    it('should return status as "OK"', async () => {
        const response = await request(app).get("/health");

        expect(response.body.status).toBe("OK");
    });

    it("should return success true and timestamp", async () => {
        const response = await request(app).get("/health");

        expect(response.body.success).toBe(true);
        expect(response.body.timestamp).toBeDefined();
        expect(new Date(response.body.timestamp).toISOString()).toBe(
        response.body.timestamp
        );
    });
});