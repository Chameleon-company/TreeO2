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

describe("Scan Batches Integration Tests", () => {
  let countryId: number;
  let adminLocationId: number;
  let projectId: number;
  let inactiveProjectId: number;
  let farmerId: number;
  let unassignedFarmerId: number;
  let managerId: number;
  let inspectorId: number;
  let unassignedInspectorId: number;
  let speciesId: number;
  let unassignedSpeciesId: number;
  let batchId: number;

  const validPayload = () => ({
    project_id: projectId,
    uploaded_at: "2024-05-20T10:35:00.000Z",
    scans: [
      {
        fob_id: `SCAN-BATCH-${Date.now()}-${Math.random()}`,
        farmer_id: farmerId,
        species_id: speciesId,
        estimated_planted_year: 2024,
        estimated_planted_month: 5,
        planted_date: "2024-05-20",
        height_m: 2.5,
        circumference_cm: 45.3,
        diameter_cm: 14.4,
        latitude: -8.5569,
        longitude: 125.5603,
        photo_id: "550e8400-e29b-41d4-a716-446655440000",
        device_id: "MOB-001",
      },
    ],
  });

  beforeAll(async () => {
    await prisma.treeScanAudit.deleteMany();
    await prisma.treeScan.deleteMany();
    await prisma.scanBatch.deleteMany();
    await prisma.projectTreeType.deleteMany();
    await prisma.userProject.deleteMany();

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "scan-batch-dev-admin@test.com",
            "scan-batch-dev-farmer@test.com",
            "scan-batch-dev-manager@test.com",
            "scan-batch-dev-inspector@test.com",
            "scan-batch-dev-developer@test.com",
            "scan-batch-farmer@test.com",
            "scan-batch-unassigned-farmer@test.com",
            "scan-batch-unassigned-inspector@test.com",
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
          startsWith: "Scan Batch Test",
        },
      },
    });

    await prisma.treeType.deleteMany({
      where: {
        key: {
          in: ["scan-batch-mahogany", "scan-batch-unassigned-species"],
        },
      },
    });

    await prisma.location.deleteMany({
      where: {
        name: "Scan Batch Test Location",
      },
    });

    await prisma.country.deleteMany({
      where: {
        iso2: "SB",
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: { name: "Admin" },
    });

    const managerRole = await prisma.role.upsert({
      where: { name: "Manager" },
      update: {},
      create: { name: "Manager" },
    });

    const inspectorRole = await prisma.role.upsert({
      where: { name: "Inspector" },
      update: {},
      create: { name: "Inspector" },
    });

    const farmerRole = await prisma.role.upsert({
      where: { name: "Farmer" },
      update: {},
      create: { name: "Farmer" },
    });

    const developerRole = await prisma.role.upsert({
      where: { name: "Developer" },
      update: {},
      create: { name: "Developer" },
    });

    const country = await prisma.country.create({
      data: {
        name: "Scan Batch Test Country",
        iso2: "SB",
        iso3: "SBT",
      },
    });

    countryId = country.id;

    const location = await prisma.location.create({
      data: {
        countryId,
        level: 1,
        name: "Scan Batch Test Location",
      },
    });

    adminLocationId = location.id;

    const project = await prisma.project.create({
      data: {
        name: "Scan Batch Test Project",
        description: "Project used for scan batch tests",
        countryId,
        adminLocationId,
        isActive: true,
      },
    });

    projectId = project.id;

    const inactiveProject = await prisma.project.create({
      data: {
        name: "Scan Batch Test Inactive Project",
        description: "Inactive project used for scan batch tests",
        countryId,
        adminLocationId,
        isActive: false,
      },
    });

    inactiveProjectId = inactiveProject.id;

    await prisma.user.upsert({
      where: { id: DEV_USER_IDS.ADMIN },
      update: {
        name: "Scan Batch Dev Admin",
        email: "scan-batch-dev-admin@test.com",
        roleId: adminRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        id: DEV_USER_IDS.ADMIN,
        name: "Scan Batch Dev Admin",
        email: "scan-batch-dev-admin@test.com",
        roleId: adminRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    await prisma.user.upsert({
      where: { id: DEV_USER_IDS.FARMER },
      update: {
        name: "Scan Batch Dev Farmer",
        email: "scan-batch-dev-farmer@test.com",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        id: DEV_USER_IDS.FARMER,
        name: "Scan Batch Dev Farmer",
        email: "scan-batch-dev-farmer@test.com",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    const manager = await prisma.user.upsert({
      where: { id: DEV_USER_IDS.MANAGER },
      update: {
        name: "Scan Batch Dev Manager",
        email: "scan-batch-dev-manager@test.com",
        roleId: managerRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        id: DEV_USER_IDS.MANAGER,
        name: "Scan Batch Dev Manager",
        email: "scan-batch-dev-manager@test.com",
        roleId: managerRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    managerId = manager.id;

    const inspector = await prisma.user.upsert({
      where: { id: DEV_USER_IDS.INSPECTOR },
      update: {
        name: "Scan Batch Dev Inspector",
        email: "scan-batch-dev-inspector@test.com",
        roleId: inspectorRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        id: DEV_USER_IDS.INSPECTOR,
        name: "Scan Batch Dev Inspector",
        email: "scan-batch-dev-inspector@test.com",
        roleId: inspectorRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    inspectorId = inspector.id;

    await prisma.user.upsert({
      where: { id: DEV_USER_IDS.DEVELOPER },
      update: {
        name: "Scan Batch Dev Developer",
        email: "scan-batch-dev-developer@test.com",
        roleId: developerRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        id: DEV_USER_IDS.DEVELOPER,
        name: "Scan Batch Dev Developer",
        email: "scan-batch-dev-developer@test.com",
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
      where: { email: "scan-batch-farmer@test.com" },
      update: {
        name: "Scan Batch Farmer",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        name: "Scan Batch Farmer",
        email: "scan-batch-farmer@test.com",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    farmerId = farmer.id;

    const unassignedFarmer = await prisma.user.upsert({
      where: { email: "scan-batch-unassigned-farmer@test.com" },
      update: {
        name: "Scan Batch Unassigned Farmer",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        name: "Scan Batch Unassigned Farmer",
        email: "scan-batch-unassigned-farmer@test.com",
        roleId: farmerRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    unassignedFarmerId = unassignedFarmer.id;

    const unassignedInspector = await prisma.user.upsert({
      where: { email: "scan-batch-unassigned-inspector@test.com" },
      update: {
        name: "Scan Batch Unassigned Inspector",
        roleId: inspectorRole.id,
        accountActive: true,
        canSignIn: true,
      },
      create: {
        name: "Scan Batch Unassigned Inspector",
        email: "scan-batch-unassigned-inspector@test.com",
        roleId: inspectorRole.id,
        accountActive: true,
        canSignIn: true,
      },
    });

    unassignedInspectorId = unassignedInspector.id;

    const species = await prisma.treeType.create({
      data: {
        name: "Scan Batch Mahogany",
        key: "scan-batch-mahogany",
        scientificName: "Swietenia macrophylla",
        dryWeightDensity: 550,
      },
    });

    speciesId = species.id;

    const unassignedSpecies = await prisma.treeType.create({
      data: {
        name: "Scan Batch Unassigned Species",
        key: "scan-batch-unassigned-species",
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
    await prisma.scanBatch.deleteMany();

    const batch = await prisma.scanBatch.create({
      data: {
        inspectorId,
        projectId,
        uploadedAt: new Date("2024-05-20T10:35:00.000Z"),
      },
    });

    batchId = batch.id;

    await prisma.treeScan.create({
      data: {
        fobId: "SCAN-BATCH-BASE",
        projectId,
        farmerId,
        inspectorId,
        speciesId,
        estimatedPlantedYear: 2024,
        estimatedPlantedMonth: 5,
        plantedDate: new Date("2024-05-20"),
        heightM: 2.5,
        circumferenceCm: 45.3,
        diameterCm: 14.4,
        latitude: -8.5569,
        longitude: 125.5603,
        photoId: "550e8400-e29b-41d4-a716-446655440000",
        deviceId: "MOB-001",
        batchId,
      },
    });
  });

  afterAll(async () => {
    await prisma.treeScanAudit.deleteMany();
    await prisma.treeScan.deleteMany();
    await prisma.scanBatch.deleteMany();

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

  // Tests for GET /scan-batches endpoint authorization, filtering, and pagination behaviour.
  describe("GET /scan-batches", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/scan-batches");

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token", async () => {
      const response = await request(app)
        .get("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 200 for MANAGER token and only return assigned project batches", async () => {
      const response = await request(app)
        .get("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(
        response.body.data.every(
          (batch: { projectId: number }) => batch.projectId === projectId,
        ),
      ).toBe(true);
    });

    it("should return 200 for INSPECTOR token and only return own batches", async () => {
      const response = await request(app)
        .get("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(
        response.body.data.every(
          (batch: { inspectorId: number }) =>
            batch.inspectorId === inspectorId,
        ),
      ).toBe(true);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .get("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });

    it("should filter by project_id", async () => {
      const response = await request(app)
        .get(`/scan-batches?project_id=${projectId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.every(
          (batch: { projectId: number }) => batch.projectId === projectId,
        ),
      ).toBe(true);
    });

    it("should return 400 for invalid pagination", async () => {
      const response = await request(app)
        .get("/scan-batches?page=0&limit=0")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });
  });

  // Tests for GET /scan-batches/:id endpoint authorization, validation, and retrieval behaviour.
  describe("GET /scan-batches/:id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get(`/scan-batches/${batchId}`);

      expect(response.status).toBe(401);
    });

    it("should return 200 for ADMIN token when batch exists", async () => {
      const response = await request(app)
        .get(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(batchId);
    });

    it("should return 200 for MANAGER token when batch belongs to assigned project", async () => {
      const response = await request(app)
        .get(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBe(projectId);
    });

    it("should return 200 for INSPECTOR token when batch belongs to inspector", async () => {
      const response = await request(app)
        .get(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inspectorId).toBe(inspectorId);
    });

    it("should return 403 for FARMER token", async () => {
      const response = await request(app)
        .get(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.FARMER}`);

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid scan batch id", async () => {
      const response = await request(app)
        .get("/scan-batches/0")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when scan batch does not exist", async () => {
      const response = await request(app)
        .get("/scan-batches/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });
  });

  // Tests for POST /scan-batches endpoint validation, authorization, and batch creation behaviour.
  describe("POST /scan-batches", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .send(validPayload());

      expect(response.status).toBe(401);
    });

    it("should return 201 for INSPECTOR token and create scan batch with tree scans", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send(validPayload());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.inspectorId).toBe(inspectorId);
      expect(response.body.data.treeScans.length).toBe(1);
    });

    it("should return 403 for ADMIN token", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`)
        .send(validPayload());

      expect(response.status).toBe(403);
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`)
        .send(validPayload());

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [],
        });

      expect(response.status).toBe(400);
    });

    it("should return 422 for inactive project", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          project_id: inactiveProjectId,
        });

      expect(response.status).toBe(422);
    });

    it("should return 403 when farmer is not assigned to project", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [
            {
              ...validPayload().scans[0],
              farmer_id: unassignedFarmerId,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it("should return 403 when species is not assigned to project", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [
            {
              ...validPayload().scans[0],
              species_id: unassignedSpeciesId,
            },
          ],
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid coordinates", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [
            {
              ...validPayload().scans[0],
              latitude: 100,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for future planted date", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [
            {
              ...validPayload().scans[0],
              planted_date: "2035-01-01",
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid estimated planted month", async () => {
      const response = await request(app)
        .post("/scan-batches")
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`)
        .send({
          ...validPayload(),
          scans: [
            {
              ...validPayload().scans[0],
              estimated_planted_month: 15,
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  // Tests for DELETE /scan-batches/:id endpoint authorization and dependency protection behaviour.
  describe("DELETE /scan-batches/:id", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).delete(`/scan-batches/${batchId}`);

      expect(response.status).toBe(401);
    });

    it("should return 403 for INSPECTOR token", async () => {
      const response = await request(app)
        .delete(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.INSPECTOR}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for MANAGER token", async () => {
      const response = await request(app)
        .delete(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.MANAGER}`);

      expect(response.status).toBe(403);
    });

    it("should return 409 for ADMIN token when batch has related tree scans", async () => {
      const response = await request(app)
        .delete(`/scan-batches/${batchId}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should return 200 for ADMIN token when batch has no related tree scans", async () => {
      const emptyBatch = await prisma.scanBatch.create({
        data: {
          inspectorId,
          projectId,
          uploadedAt: new Date(),
        },
      });

      const response = await request(app)
        .delete(`/scan-batches/${emptyBatch.id}`)
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 when scan batch does not exist", async () => {
      const response = await request(app)
        .delete("/scan-batches/999999")
        .set("Authorization", `Bearer ${TOKENS.ADMIN}`);

      expect(response.status).toBe(404);
    });
  });
});