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

const DEV_USER_IDS = {
    ADMIN: 1,
    FARMER: 2,
    MANAGER: 3,
    INSPECTOR: 4,
    DEVELOPER: 5,
};

describe("Tree Scans Integration Tests", () => {
    let countryId: number;
    let adminLocationId: number;
    let projectId: number;
    let inactiveProjectId: number;
    let farmerId: number;
    let managerId: number;
    let inspectorId: number;
    let unassignedFarmerId: number;
    let unassignedInspectorId: number;
    let speciesId: number;
    let unassignedSpeciesId: number;
    let scanId: number;

    const validPayload = () => ({
        fobId: `FOB-${Date.now()}-${Math.random()}`,
        projectId,
        farmerId,
        inspectorId,
        speciesId,
        estimatedPlantedYear: 2020,
        estimatedPlantedMonth: 6,
        plantedDate: "2020-06-10",
        heightM: 3.25,
        circumferenceCm: 18.4,
        diameterCm: 5.8,
        latitude: -37.8136,
        longitude: 144.9631,
        photoId: "550e8400-e29b-41d4-a716-446655440000",
        deviceId: "DEVICE-001",
        validationNotes: "Healthy tree",
    });

    beforeAll(async () => {
        await prisma.treeScanAudit.deleteMany();
        await prisma.treeScan.deleteMany();
        await prisma.projectTreeType.deleteMany();
        await prisma.userProject.deleteMany();

        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        "tree-scan-dev-admin@test.com",
                        "tree-scan-dev-farmer@test.com",
                        "tree-scan-dev-manager@test.com",
                        "tree-scan-dev-inspector@test.com",
                        "tree-scan-dev-developer@test.com",
                        "tree-scan-farmer@test.com",
                        "tree-scan-inspector@test.com",
                        "tree-scan-unassigned-farmer@test.com",
                        "tree-scan-unassigned-inspector@test.com",
                    ],
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [
                        DEV_USER_IDS.ADMIN,
                        DEV_USER_IDS.FARMER,
                        DEV_USER_IDS.MANAGER,
                        DEV_USER_IDS.INSPECTOR,
                        DEV_USER_IDS.DEVELOPER,
                    ],
                },
            },
        });

        await prisma.project.deleteMany({
            where: {
                name: {
                    startsWith: "Tree Scan Test",
                },
            },
        });

        await prisma.treeType.deleteMany({
            where: {
                key: {
                    in: [
                        "tree-scan-mahogany",
                        "tree-scan-unassigned-species",
                    ],
                },
            },
        });

        await prisma.location.deleteMany({
            where: {
                name: "Tree Scan Test Location",
            },
        });

        await prisma.country.deleteMany({
            where: {
                iso2: "TS",
            },
        });

        const adminRole = await prisma.role.upsert({
            where: { name: "ADMIN" },
            update: {},
            create: { name: "ADMIN" },
        });

        const managerRole = await prisma.role.upsert({
            where: { name: "MANAGER" },
            update: {},
            create: { name: "MANAGER" },
        });

        const farmerRole = await prisma.role.upsert({
            where: { name: "FARMER" },
            update: {},
            create: { name: "FARMER" },
        });

        const inspectorRole = await prisma.role.upsert({
            where: { name: "INSPECTOR" },
            update: {},
            create: { name: "INSPECTOR" },
        });

        const developerRole = await prisma.role.upsert({
            where: { name: "DEVELOPER" },
            update: {},
            create: { name: "DEVELOPER" },
        });

        const country = await prisma.country.create({
            data: {
                name: "Tree Scan Test Country",
                iso2: "TS",
                iso3: "TST",
            },
        });

        countryId = country.id;

        const location = await prisma.location.create({
            data: {
                countryId,
                level: 1,
                name: "Tree Scan Test Location",
            },
        });

        adminLocationId = location.id;

        const project = await prisma.project.create({
            data: {
                name: "Tree Scan Test Project",
                description: "Project used for tree scan tests",
                countryId,
                adminLocationId,
                isActive: true,
            },
        });

        projectId = project.id;

        const inactiveProject = await prisma.project.create({
            data: {
                name: "Tree Scan Test Inactive Project",
                description: "Inactive project used for tree scan tests",
                countryId,
                adminLocationId,
                isActive: false,
            },
        });

        inactiveProjectId = inactiveProject.id;

        await prisma.user.upsert({
            where: { id: DEV_USER_IDS.ADMIN },
            update: {
                name: "Tree Scan Dev Admin",
                email: "tree-scan-dev-admin@test.com",
                roleId: adminRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                id: DEV_USER_IDS.ADMIN,
                name: "Tree Scan Dev Admin",
                email: "tree-scan-dev-admin@test.com",
                roleId: adminRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        const manager = await prisma.user.upsert({
            where: { id: DEV_USER_IDS.MANAGER },
            update: {
                name: "Tree Scan Dev Manager",
                email: "tree-scan-dev-manager@test.com",
                roleId: managerRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                id: DEV_USER_IDS.MANAGER,
                name: "Tree Scan Dev Manager",
                email: "tree-scan-dev-manager@test.com",
                roleId: managerRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        managerId = manager.id;

        const inspector = await prisma.user.upsert({
            where: { id: DEV_USER_IDS.INSPECTOR },
            update: {
                name: "Tree Scan Inspector",
                email: "tree-scan-dev-inspector@test.com",
                roleId: inspectorRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                id: DEV_USER_IDS.INSPECTOR,
                name: "Tree Scan Inspector",
                email: "tree-scan-dev-inspector@test.com",
                roleId: inspectorRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        inspectorId = inspector.id;

        await prisma.user.upsert({
            where: { id: DEV_USER_IDS.FARMER },
            update: {
                name: "Tree Scan Dev Farmer",
                email: "tree-scan-dev-farmer@test.com",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                id: DEV_USER_IDS.FARMER,
                name: "Tree Scan Dev Farmer",
                email: "tree-scan-dev-farmer@test.com",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        await prisma.user.upsert({
            where: { id: DEV_USER_IDS.DEVELOPER },
            update: {
                name: "Tree Scan Dev Developer",
                email: "tree-scan-dev-developer@test.com",
                roleId: developerRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                id: DEV_USER_IDS.DEVELOPER,
                name: "Tree Scan Dev Developer",
                email: "tree-scan-dev-developer@test.com",
                roleId: developerRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        await prisma.$executeRaw`
            SELECT setval(
                pg_get_serial_sequence('users', 'id'),
                COALESCE((SELECT MAX(id) FROM "users"), 1),
                true
            );
        `;

        const farmer = await prisma.user.upsert({
            where: { email: "tree-scan-farmer@test.com" },
            update: {
                name: "Tree Scan Farmer",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                name: "Tree Scan Farmer",
                email: "tree-scan-farmer@test.com",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        farmerId = farmer.id;

        const unassignedFarmer = await prisma.user.upsert({
            where: { email: "tree-scan-unassigned-farmer@test.com" },
            update: {
                name: "Tree Scan Unassigned Farmer",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                name: "Tree Scan Unassigned Farmer",
                email: "tree-scan-unassigned-farmer@test.com",
                roleId: farmerRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        unassignedFarmerId = unassignedFarmer.id;

        const unassignedInspector = await prisma.user.upsert({
            where: { email: "tree-scan-unassigned-inspector@test.com" },
            update: {
                name: "Tree Scan Unassigned Inspector",
                roleId: inspectorRole.id,
                accountActive: true,
                canSignIn: true,
            },
            create: {
                name: "Tree Scan Unassigned Inspector",
                email: "tree-scan-unassigned-inspector@test.com",
                roleId: inspectorRole.id,
                accountActive: true,
                canSignIn: true,
            },
        });

        unassignedInspectorId = unassignedInspector.id;

        const species = await prisma.treeType.create({
            data: {
                name: "Tree Scan Mahogany",
                key: "tree-scan-mahogany",
                scientificName: "Swietenia macrophylla",
                dryWeightDensity: 550,
            },
        });

        speciesId = species.id;

        const unassignedSpecies = await prisma.treeType.create({
            data: {
                name: "Tree Scan Unassigned Species",
                key: "tree-scan-unassigned-species",
                scientificName: "Unassigned species",
                dryWeightDensity: 500,
            },
        });

        unassignedSpeciesId = unassignedSpecies.id;

        await prisma.userProject.createMany({
            data: [
                {
                    userId: farmerId,
                    projectId,
                },
                {
                    userId: inspectorId,
                    projectId,
                },
                {
                    userId: managerId,
                    projectId,
                },
            ],
            skipDuplicates: true,
        });

        await prisma.projectTreeType.create({
            data: {
                projectId,
                treeTypeId: speciesId,
            },
        });
    });

    beforeEach(async () => {
        await prisma.treeScanAudit.deleteMany();
        await prisma.treeScan.deleteMany();

        const scan = await prisma.treeScan.create({
            data: {
                fobId: "FOB-BASE",
                projectId,
                farmerId,
                inspectorId,
                speciesId,
                estimatedPlantedYear: 2020,
                estimatedPlantedMonth: 6,
                plantedDate: new Date("2020-06-10"),
                heightM: 3.25,
                circumferenceCm: 18.4,
                diameterCm: 5.8,
                latitude: -37.8136,
                longitude: 144.9631,
                photoId: "550e8400-e29b-41d4-a716-446655440000",
                deviceId: "DEVICE-001",
                validationNotes: "Healthy tree",
            },
        });

        scanId = scan.id;
    });

    afterAll(async () => {
        await prisma.treeScanAudit.deleteMany();
        await prisma.treeScan.deleteMany();

        await prisma.projectTreeType.deleteMany({
            where: {
                projectId,
            },
        });

        await prisma.userProject.deleteMany({
            where: {
                projectId,
            },
        });

        await prisma.project.deleteMany({
            where: {
                id: {
                    in: [projectId, inactiveProjectId].filter(
                        (id): id is number => id !== undefined,
                    ),
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [
                        DEV_USER_IDS.ADMIN,
                        DEV_USER_IDS.FARMER,
                        DEV_USER_IDS.MANAGER,
                        DEV_USER_IDS.INSPECTOR,
                        DEV_USER_IDS.DEVELOPER,
                        farmerId,
                        unassignedFarmerId,
                        unassignedInspectorId,
                    ].filter((id): id is number => id !== undefined),
                },
            },
        });

        await prisma.treeType.deleteMany({
            where: {
                id: {
                    in: [speciesId, unassignedSpeciesId].filter(
                        (id): id is number => id !== undefined,
                    ),
                },
            },
        });

        await prisma.location.deleteMany({
            where: {
                id: adminLocationId,
            },
        });

        await prisma.country.deleteMany({
            where: {
                id: countryId,
            },
        });

        await prisma.$disconnect();
    });

    // Tests for GET /tree-scans endpoint authorization, filtering, and pagination behaviour.
    describe("GET /tree-scans", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).get("/tree-scans");

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token", async () => {
            const response = await request(app)
                .get("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.data)).toBe(true);
        });

        it("should return 200 for MANAGER token and only return assigned project scans", async () => {
            const response = await request(app)
                .get("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.data)).toBe(true);
            expect(
                response.body.data.data.every(
                    (scan: { projectId: number }) => scan.projectId === projectId,
                ),
            ).toBe(true);
        });

        it("should return 403 for INSPECTOR token", async () => {
            const response = await request(app)
                .get("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

            expect(response.status).toBe(403);
        });

        it("should return 403 for FARMER token", async () => {
            const response = await request(app)
                .get("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.FARMER}`);

            expect(response.status).toBe(403);
        });

        it("should filter by projectId", async () => {
            const response = await request(app)
                .get(`/tree-scans?projectId=${projectId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.data.data.length).toBeGreaterThanOrEqual(1);
            expect(
                response.body.data.data.every(
                    (scan: { projectId: number }) => scan.projectId === projectId,
                ),
            ).toBe(true);
        });

        it("should return 400 for invalid pagination", async () => {
            const response = await request(app)
                .get("/tree-scans?page=0&limit=0")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(400);
        });
    });

    // Tests for GET /tree-scans/:id endpoint authorization, validation, and retrieval behaviour.
    describe("GET /tree-scans/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).get(`/tree-scans/${scanId}`);

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token when scan exists", async () => {
            const response = await request(app)
                .get(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(scanId);
        });

        it("should return 200 for MANAGER token when scan belongs to assigned project", async () => {
            const response = await request(app)
                .get(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.projectId).toBe(projectId);
        });

        it("should return 200 for INSPECTOR token when scan belongs to inspector", async () => {
            const response = await request(app)
                .get(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.inspectorId).toBe(inspectorId);
        });

        it("should return 403 for FARMER token", async () => {
            const response = await request(app)
                .get(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.FARMER}`);

            expect(response.status).toBe(403);
        });

        it("should return 400 for invalid tree scan id", async () => {
            const response = await request(app)
                .get("/tree-scans/0")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(400);
        });

        it("should return 404 when tree scan does not exist", async () => {
            const response = await request(app)
                .get("/tree-scans/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(404);
        });
    });

    // Tests for POST /tree-scans endpoint validation, authorization, and scan creation behaviour.
    describe("POST /tree-scans", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .send(validPayload());

            expect(response.status).toBe(401);
        });

        it("should return 403 for ADMIN token", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send(validPayload());

            expect(response.status).toBe(403);
        });

        it("should return 201 for INSPECTOR token and create a tree scan", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send(validPayload());

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
                .send(validPayload());

            expect(response.status).toBe(403);
        });

        it("should return 400 for invalid payload", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    fobId: "",
                });

            expect(response.status).toBe(400);
        });

        it("should return 400 for inactive project", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    projectId: inactiveProjectId,
                });

            expect(response.status).toBe(400);
        });

        it("should return 403 when farmer is not assigned to project", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    farmerId: unassignedFarmerId,
                });

            expect(response.status).toBe(403);
        });

        it("should return 403 when inspector is not assigned to project", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    inspectorId: unassignedInspectorId,
                });

            expect(response.status).toBe(403);
        });

        it("should return 400 when species is not assigned to project", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    speciesId: unassignedSpeciesId,
                });

            expect(response.status).toBe(400);
        });

        it("should return 400 for invalid coordinates", async () => {
            const response = await request(app)
                .post("/tree-scans")
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    ...validPayload(),
                    latitude: 100,
                });

            expect(response.status).toBe(400);
        });
    });

    // Tests for PUT /tree-scans/:id endpoint authorization, validation, and scan correction behaviour.
    describe("PUT /tree-scans/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .send({
                    heightM: 4.1,
                    correctionReason: "Updated measurement",
                });

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token and update tree scan", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    heightM: 4.1,
                    correctionReason: "Updated measurement",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Number(response.body.data.heightM)).toBe(4.1);
            expect(response.body.data.isCorrected).toBe(true);
        });

        it("should return 403 for INSPECTOR token", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
                .send({
                    heightM: 4.1,
                    correctionReason: "Inspector update attempt",
                });

            expect(response.status).toBe(403);
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
                .send({
                    heightM: 4.1,
                    correctionReason: "Manager update attempt",
                });

            expect(response.status).toBe(403);
        });

        it("should return 400 for empty payload", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it("should return 400 when correction reason is missing", async () => {
            const response = await request(app)
                .put(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    heightM: 4.1,
                });

            expect(response.status).toBe(400);
        });

        it("should return 404 when tree scan does not exist", async () => {
            const response = await request(app)
                .put("/tree-scans/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
                .send({
                    heightM: 4.1,
                    correctionReason: "Updated measurement",
                });

            expect(response.status).toBe(404);
        });
    });

    // Tests for DELETE /tree-scans/:id endpoint authorization and archive behaviour.
    describe("DELETE /tree-scans/:id", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).delete(`/tree-scans/${scanId}`);

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token and archive tree scan", async () => {
            const response = await request(app)
                .delete(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe(
                "Tree scan archived successfully",
            );

            const archivedScan = await prisma.treeScan.findUnique({
                where: { id: scanId },
            });

            expect(archivedScan?.isArchived).toBe(true);
        });

        it("should return 403 for MANAGER token", async () => {
            const response = await request(app)
                .delete(`/tree-scans/${scanId}`)
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(403);
        });

        it("should return 404 when tree scan does not exist", async () => {
            const response = await request(app)
                .delete("/tree-scans/999999")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(404);
        });
    });

    // Tests for POST /tree-scans/recycle/:fobId endpoint authorization and archive behaviour.
    describe("POST /tree-scans/recycle/:fobId", () => {
        it("should return 401 when no token is provided", async () => {
            const response = await request(app).post(
                "/tree-scans/recycle/FOB-BASE",
            );

            expect(response.status).toBe(401);
        });

        it("should return 200 for ADMIN token and archive scans linked to FOB", async () => {
            const response = await request(app)
                .post("/tree-scans/recycle/FOB-BASE")
                .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.archivedCount).toBeGreaterThanOrEqual(1);
        });

        it("should return 200 for MANAGER token and archive scans linked to FOB", async () => {
            const response = await request(app)
                .post("/tree-scans/recycle/FOB-BASE")
                .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.archivedCount).toBeGreaterThanOrEqual(1);
        });
    });
});