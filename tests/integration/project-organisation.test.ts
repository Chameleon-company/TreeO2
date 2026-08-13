import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../src/app";
import { customError } from "../../src/utils/errorCodes";

const prisma = new PrismaClient();

// TODO: T2-2026 API13: add test cases for auth permissions
const TOKENS = {
	ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
	// MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
	// INSPECTOR: process.env.AUTH_DEV_INSPECTOR_TOKEN!,
	// FARMER: process.env.AUTH_DEV_FARMER_TOKEN!,
	// DEVELOPER: process.env.AUTH_DEV_DEVELOPER_TOKEN!,
};

describe("Project Organisation Integration Tests", () => {
	let projectId: number;
	let projectId2: number;
	let orgId: number;
	let orgId2: number;

	beforeEach(async () => {
		await prisma.project.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.projectOrganisation.deleteMany();

		const org = await prisma.organisation.create({
			data: {
				name: "Test organisation",
			},
		});

		orgId = org.id;

		const org2 = await prisma.organisation.create({
			data: {
				name: "Test organisation 2",
			},
		});

		orgId2 = org2.id;

		const project = await prisma.project.create({
			data: {
				ownerOrganisationId: org.id,
				name: "Reforestation Project",
				description: "Tree planting initiative",
				isActive: true,
			},
		});

		projectId = project.id;

		const project2 = await prisma.project.create({
			data: {
				ownerOrganisationId: org2.id,
				name: "Second Project",
				description: "Another project",
				isActive: true,
			},
		});

		projectId2 = project2.id;
	});

	afterAll(async () => {
		await prisma.project.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.projectOrganisation.deleteMany();
		await prisma.$disconnect();
	});

	describe("GET /project-organisations", () => {
		// TODO: T2-2026 API13: add test cases for auth permissions

		it("should return 200 with empty data when no entries exist", async () => {
			const response = await request(app)
				.get("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual([]);
		});

		it("should return 200 with all entries ordered by newest first", async () => {
			await prisma.projectOrganisation.create({
				data: {
					projectId: projectId2,
					organisationId: orgId2,
					accessType: "partner",
				},
			});

			await prisma.projectOrganisation.create({
				data: {
					projectId: projectId,
					organisationId: orgId,
					accessType: "shared",
				},
			});

			const response = await request(app)
				.get("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBe(2);

			// check the CreateAt entry to make sure the date is in order of the array
			const first = new Date(response.body.data[0].createdAt).getTime();
			const second = new Date(response.body.data[1].createdAt).getTime();
			expect(first).toBeGreaterThanOrEqual(second);
		});

		it("should return entries with correct fields", async () => {
			const response = await request(app)
				.get("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			if (response.body.data.length > 0) {
				const entry = response.body.data[0];
				expect(entry).toHaveProperty("projectId");
				expect(entry).toHaveProperty("organisationId");
				expect(entry).toHaveProperty("accessType");
				expect(entry).toHaveProperty("createdAt");
			}
		});
	});

	describe("POST /project-organisations", () => {
		// TODO: T2-2026 API13: add test cases for auth permissions

		it("should default accessType to 'shared' when omitted", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId2,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.accessType).toBe("shared");
		});

		it("should create entry with accessType shared", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId2,
					accessType: "shared",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.accessType).toBe("shared");
		});

		it("should create entry with accessType partner", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId2,
					accessType: "partner",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.accessType).toBe("partner");
		});

		it("should return 400 when projectId is missing", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					organisationId: orgId2,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is missing", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when accessType is invalid", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId2,
					accessType: "invalid_type",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when projectId is negative", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: -1,
					organisationId: orgId2,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: -1,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when projectId is zero", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: 0,
					organisationId: orgId2,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: 0,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when projectId is not an integer", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: 1.5,
					organisationId: orgId2,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not an integer", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: 2.5,
					accessType: "shared",
				});

			expect(response.status).toBe(400);
		});

		it("should return 404 when project does not exist", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: 999999,
					organisationId: orgId2,
					accessType: "shared",
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 404 when organisation does not exist", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: 999999,
					accessType: "shared",
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 422 when accessType is owner", async () => {
			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId2,
					accessType: "owner",
				});

			const err = customError("VAL_002");
			expect(response.status).toBe(422);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
			expect(response.body.error.detail).toBe("Access type can't be owner");
		});

		it("should return 409 when duplicate entry exists", async () => {
			await prisma.projectOrganisation.create({
				data: {
					projectId,
					organisationId: orgId,
					accessType: "shared",
				},
			});

			const response = await request(app)
				.post("/project-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					projectId: projectId,
					organisationId: orgId,
					accessType: "shared",
				});

			expect(response.status).toBe(409);
		});
	});

	describe("DELETE /project-organisations/:projectId", () => {
		beforeEach(async () => {
			await prisma.projectOrganisation.deleteMany();

			await prisma.projectOrganisation.create({
				data: {
					projectId,
					organisationId: orgId,
					accessType: "shared",
				},
			});
		});

		afterEach(async () => {
			await prisma.projectOrganisation.deleteMany();
		});

		// TODO: T2-2026 API13: add test cases for auth permissions

		it("should return 400 when projectId is not a number", async () => {
			const response = await request(app)
				.delete(`/project-organisations/abc/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when projectId is zero", async () => {
			const response = await request(app)
				.delete(`/project-organisations/0/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when projectId is negative", async () => {
			const response = await request(app)
				.delete(`/project-organisations/-1/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not a number", async () => {
			const response = await request(app)
				.delete(`/project-organisations/${projectId}/abc`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.delete(`/project-organisations/${projectId}/0`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.delete(`/project-organisations/${projectId}/-1`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 404 when entry does not exist", async () => {
			await prisma.projectOrganisation.deleteMany();

			const response = await request(app)
				.delete(`/project-organisations/${projectId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
			expect(response.body.error.detail).toBe(
				"Project-organisation sharing link not found",
			);
		});

		it("should return 422 when entry accessType is owner", async () => {
			await prisma.projectOrganisation.deleteMany();

			await prisma.projectOrganisation.create({
				data: {
					projectId: projectId,
					organisationId: orgId,
					accessType: "owner",
				},
			});

			const response = await request(app)
				.delete(`/project-organisations/${projectId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			const err = customError("VAL_002");
			expect(response.status).toBe(422);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
			expect(response.body.error.detail).toBe("Access type can't be owner");
		});

		it("should successfully delete entry with accessType partner", async () => {
			await prisma.projectOrganisation.deleteMany();

			await prisma.projectOrganisation.create({
				data: {
					projectId: projectId,
					organisationId: orgId,
					accessType: "partner",
				},
			});

			const response = await request(app)
				.delete(`/project-organisations/${projectId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.message).toBe(
				"Project organisation sharing removed successfully",
			);

			const deleted = await prisma.projectOrganisation.findUnique({
				where: {
					projectId_organisationId: {
						projectId: projectId,
						organisationId: orgId,
					},
				},
			});

			expect(deleted).toBeNull();
		});

		it("should successfully delete entry with accessType shared", async () => {
			await prisma.projectOrganisation.deleteMany();

			await prisma.projectOrganisation.create({
				data: {
					projectId: projectId,
					organisationId: orgId,
					accessType: "shared",
				},
			});

			const response = await request(app)
				.delete(`/project-organisations/${projectId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.message).toBe(
				"Project organisation sharing removed successfully",
			);

			const deleted = await prisma.projectOrganisation.findUnique({
				where: {
					projectId_organisationId: {
						projectId: projectId,
						organisationId: orgId,
					},
				},
			});

			expect(deleted).toBeNull();
		});
	});
});
