import { HealthService } from "../../src/modules/health/health.service";

describe("HealthService", () => {
    it("should return success true", () => {
        const service = new HealthService();
        const result = service.getHealthStatus();

        expect(result.success).toBe(true);
    });

    it('should return status as "OK"', () => {
        const service = new HealthService();
        const result = service.getHealthStatus();

        expect(result.status).toBe("OK");
    });

    it("should return a valid ISO timestamp", () => {
        const service = new HealthService();
        const result = service.getHealthStatus();

        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
});