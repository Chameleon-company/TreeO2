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

describe("Project Management Integration Tests", () => {
    let countryId: number;
    let adminLocationId: number;
    let projectId: number;

    beforeAll(async () => {
        const country = await prisma.country.create({
            data: {
                name: "Timor-Leste",
                iso2: "TL",
                iso3: "TLS",
            },
        });

        countryId = country.id;

        const location = await prisma.location.create({
            data: {
                countryId,
                level: 1,
                name: "Dili",
            },
        });

        adminLocationId = location.id;
    });

    beforeEach(async () => {
        await prisma.project.deleteMany();

        const project = await prisma.project.create({
            data: {
                name: "Reforestation Project",
                description: "Tree planting initiative",
                countryId,
                adminLocationId,
                isActive: true,
            },
        });

        projectId = project.id;
    });

    afterAll(async () => {
        await prisma.project.deleteMany();
        await prisma.location.deleteMany();
        await prisma.country.deleteMany();
        await prisma.$disconnect();
    });

    // Tests for GET /projects endpoint authorization and access control.
    describe("GET /projects", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).get("/projects");

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token", async () => {
            const response = await request(app)
                .get("/projects")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 200 for MANAGER token", async () => {
            const response = await request(app)
                .get("/projects")
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 403 for INSPECTOR token", async () => {
            const response = await request(app)
                .get("/projects")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

            expect(response.status).toBe(403);
        });

        it("should return 403 for FARMER token", async () => {
            const response = await request(app)
                .get("/projects")
                .set("Authorization", `Bearer ${TOKENS.FARMER}`);

            expect(response.status).toBe(403);
        });

        it("should return 403 for DEVELOPER token", async () => {
            const response = await request(app)
                .get("/projects")
                .set("Authorization", `Bearer ${TOKENS.DEVELOPER}`);

            expect(response.status).toBe(403);
        });
    });

    // Tests for GET /projects/:id endpoint authorization and retrieval behavior.
    describe("GET /projects/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).get(`/projects/${projectId}`);

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token when project exists", async () => {
            const response = await request(app)
                .get(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(projectId);
        });

        it("should return 200 for MANAGER token when project exists", async () => {
            const response = await request(app)
                .get(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 403 for INSPECTOR token", async () => {
            const response = await request(app)
                .get(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

            expect(response.status).toBe(403);
        });

        it("should return 404 when project does not exist", async () => {
            const response = await request(app)
                .get("/projects/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(404);
        });

        it("should return 400 for invalid project id", async () => {
            const response = await request(app)
                .get("/projects/0")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(400);
        });
    });

    // Tests for POST /projects endpoint authorization and project creation behavior.
    describe("POST /projects", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).post("/projects").send({
                name: "New Reforestation Project",
                description: "Tree planting initiative",
                countryId,
                adminLocationId,
                isActive: true,
            });

            expect(response.status).toBe(401);
        });

        it("should return 201 for ADMIN token and create a project", async () => {
            const response = await request(app)
                .post("/projects")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    name: "New Reforestation Project",
                    description: "Tree planting initiative",
                    countryId,
                    adminLocationId,
                    isActive: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("New Reforestation Project");
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .post("/projects")
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
                .send({
                    name: "New Reforestation Project",
                    countryId,
                    adminLocationId,
                });

            expect(response.status).toBe(403);
        });

        it("should return 400 for invalid payload", async () => {
            const response = await request(app)
                .post("/projects")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    name: "",
                    countryId,
                    adminLocationId,
                });

            expect(response.status).toBe(400);
        });

        it("should return 404 when country does not exist", async () => {
            const response = await request(app)
                .post("/projects")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    name: "Invalid Country Project",
                    countryId: 999999,
                    adminLocationId,
                });

            expect(response.status).toBe(404);
        });
    });

    // Tests for PUT /projects/:id endpoint authorization and update behavior.
    describe("PUT /projects/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app)
                .put(`/projects/${projectId}`)
                .send({
                    name: "Updated Reforestation Project",
                    description: "Expanded planting area",
                    isActive: false,
                });

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token and update the project", async () => {
            const response = await request(app)
                .put(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    name: "Updated Reforestation Project",
                    description: "Expanded planting area",
                    isActive: false,
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("Updated Reforestation Project");
            expect(response.body.data.isActive).toBe(false);
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .put(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
                .send({
                    name: "Manager Update Attempt",
                });

            expect(response.status).toBe(403);
        });

        it("should return 404 when project does not exist", async () => {
            const response = await request(app)
                .put("/projects/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    name: "Updated Reforestation Project",
                });

            expect(response.status).toBe(404);
        });

        it("should return 400 for empty payload", async () => {
            const response = await request(app)
                .put(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    // Tests for DELETE /projects/:id endpoint authorization and deletion behavior.
    describe("DELETE /projects/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).delete(`/projects/${projectId}`);

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token and delete the project", async () => {
            const response = await request(app)
                .delete(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe("Project deleted successfully");
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .delete(`/projects/${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(403);
        });

        it("should return 404 when project does not exist", async () => {
            const response = await request(app)
                .delete("/projects/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(404);
        });
    });
});