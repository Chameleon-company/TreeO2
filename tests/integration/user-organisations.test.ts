import "dotenv/config";
import {
	describe,
	expect,
	it,
	beforeEach,
	afterEach,
	beforeAll,
	afterAll,
} from "@jest/globals";
import request from "supertest";
import { PrismaClient, Status } from "@prisma/client";
import app from "../../src/app";
import { customError } from "../../src/utils/errorCodes";

const prisma = new PrismaClient();

const TOKENS = {
	ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
};

describe("User Organisations Integration Tests", () => {
	let userId: number;
	let userId2: number;
	let orgId: number;
	let orgId2: number;
	let roleId: number;

	beforeAll(async () => {
		await prisma.userOrganisationRoles.deleteMany();
		await prisma.userOrganisation.deleteMany();
		await prisma.organisationRole.deleteMany();
		await prisma.user.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.role.deleteMany();
	});

	beforeEach(async () => {
		const role = await prisma.role.create({
			data: {
				name: "test",
			},
			select: {
				id: true,
			},
		});
		roleId = role.id;

		// Create test users
		const user1 = await prisma.user.create({
			data: {
				name: "Integration Test User 1",
				email: `user1-int-${Date.now()}@example.com`,
				passwordHash: "$2b$10$examplehash",
				roleId,
			},
		});
		userId = user1.id;

		const user2 = await prisma.user.create({
			data: {
				name: "Integration Test User 2",
				email: `user2-int-${Date.now()}@example.com`,
				passwordHash: "$2b$10$examplehash",
				roleId,
			},
		});
		userId2 = user2.id;

		// Create test organisations
		const org1 = await prisma.organisation.create({
			data: {
				name: "Integration Test Organisation 1",
			},
		});
		orgId = org1.id;

		const org2 = await prisma.organisation.create({
			data: {
				name: "Integration Test Organisation 2",
			},
		});
		orgId2 = org2.id;
	});

	afterEach(async () => {
		await prisma.userOrganisationRoles.deleteMany();
		await prisma.userOrganisation.deleteMany();
		await prisma.organisationRole.deleteMany();
		await prisma.user.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.role.deleteMany();
	});

	afterAll(async () => {
		await prisma.userOrganisationRoles.deleteMany();
		await prisma.userOrganisation.deleteMany();
		await prisma.organisationRole.deleteMany();
		await prisma.user.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.role.deleteMany();
		await prisma.$disconnect();
	});

	describe("GET /user-organisations", () => {
		it("should return 200 with empty data when no entries exist", async () => {
			const response = await request(app)
				.get("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual([]);
			expect(response.body.pagination).toHaveProperty("page");
			expect(response.body.pagination).toHaveProperty("limit");
			expect(response.body.pagination).toHaveProperty("total");
			expect(response.body.pagination).toHaveProperty("totalPages");
		});

		it("should return 200 with all entries ordered by newest first", async () => {
			await prisma.userOrganisation.create({
				data: {
					userId: userId2,
					organisationId: orgId2,
					status: "invited",
				},
			});

			await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId,
					status: "active",
				},
			});

			const response = await request(app)
				.get("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBe(2);

			const first = new Date(response.body.data[0].createdAt).getTime();
			const second = new Date(response.body.data[1].createdAt).getTime();
			expect(first).toBeGreaterThanOrEqual(second);
		});

		it("should return entries with correct fields", async () => {
			await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId,
					status: "active",
				},
			});

			const response = await request(app)
				.get("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			expect(response.body.data).not.toHaveLength(0);
			const entry = response.body.data[0];
			expect(entry).toHaveProperty("userId");
			expect(entry).toHaveProperty("organisationId");
			expect(entry).toHaveProperty("status");
			expect(entry).toHaveProperty("createdAt");
		});

		it("should apply default pagination values", async () => {
			const response = await request(app)
				.get("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.pagination.page).toBe(1);
			expect(response.body.pagination.limit).toBe(10);
		});

		it("should return paginated results with custom page and limit", async () => {
			// Create entries with different userId/orgId combos (composite PK requires uniqueness)
			type UserOrganisationJson = {
				status: Status;
				createdAt: string;
				userId: number;
				organisationId: number;
			};
			const entries: UserOrganisationJson[] = [];
			for (let i = 0; i < 5; i++) {
				const tempUser = await prisma.user.create({
					data: {
						name: `Temp User ${i}`,
						email: `temp-user-${i}-${Date.now()}-${Math.random()}@example.com`,
						passwordHash: "$2b$10$examplehash",
						roleId,
					},
				});
				const tempOrg = await prisma.organisation.create({
					data: { name: `Temp Org ${i}` },
				});
				const entry = await prisma.userOrganisation.create({
					data: {
						userId: tempUser.id,
						organisationId: tempOrg.id,
						status: "active",
					},
				});
				entries.push({ ...entry, createdAt: entry.createdAt.toISOString() });
			}

			entries.reverse(); // make it desc order

			const response = await request(app)
				.get("/user-organisations?page=2&limit=2")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.data.length).toBe(2);
			expect(response.body.data).toEqual([entries[2], entries[3]]);
			expect(response.body.pagination.page).toBe(2);
			expect(response.body.pagination.limit).toBe(2);
			expect(response.body.pagination.totalPages).toBe(3);
		});

		it("should return 400 for invalid page value", async () => {
			const response = await request(app)
				.get("/user-organisations?page=0")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 for negative page value", async () => {
			const response = await request(app)
				.get("/user-organisations?page=-1")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 for invalid limit value", async () => {
			const response = await request(app)
				.get("/user-organisations?limit=0")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 for limit exceeding maximum", async () => {
			const response = await request(app)
				.get("/user-organisations?limit=101")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 for non-numeric page", async () => {
			const response = await request(app)
				.get("/user-organisations?page=abc")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});
	});

	describe("POST /user-organisations", () => {
		it("should default status to 'active' when omitted", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("active");
		});

		it("should create entry with status active", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
					status: "active",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("active");
			expect(response.body.data.userId).toBe(userId);
			expect(response.body.data.organisationId).toBe(orgId2);
		});

		it("should create entry with status invited", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
					status: "invited",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("invited");
		});

		it("should create entry with status suspended", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
					status: "suspended",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("suspended");
		});

		it("should return 400 when userId is missing", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					organisationId: orgId2,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is missing", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when status is invalid", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
					status: "invalid_status",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is negative", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: -1,
					organisationId: orgId2,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: -1,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is zero", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 0,
					organisationId: orgId2,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: 0,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is not an integer", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 1.5,
					organisationId: orgId2,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not an integer", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: 2.5,
				});

			expect(response.status).toBe(400);
		});

		it("should return 404 when user does not exist", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 999999,
					organisationId: orgId2,
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 404 when organisation does not exist", async () => {
			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: 999999,
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 409 when duplicate membership exists", async () => {
			await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId2,
					status: "active",
				},
			});

			const response = await request(app)
				.post("/user-organisations")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId2,
					status: "active",
				});

			const err = customError("DATA_002");
			expect(response.status).toBe(409);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});
	});

	describe("PUT /user-organisations/:userId/:organisationId", () => {
		beforeEach(async () => {
			await prisma.userOrganisation.deleteMany();

			await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId,
					status: "invited",
				},
			});
		});

		it("should return 400 when userId is not a number", async () => {
			const response = await request(app)
				.put(`/user-organisations/abc/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is zero", async () => {
			const response = await request(app)
				.put(`/user-organisations/0/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is negative", async () => {
			const response = await request(app)
				.put(`/user-organisations/-1/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not a number", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/abc`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/0`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/-1`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(400);
		});

		it("should return 400 when status is missing", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({});

			expect(response.status).toBe(400);
		});

		it("should return 400 when status is invalid", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "invalid_status" });

			expect(response.status).toBe(400);
		});

		it("should return 404 when entry does not exist", async () => {
			await prisma.userOrganisation.deleteMany();

			const response = await request(app)
				.put(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should successfully update status from invited to active", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "active" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("active");

			const updated = await prisma.userOrganisation.findUnique({
				where: {
					userId_organisationId: {
						userId: userId,
						organisationId: orgId,
					},
				},
			});

			expect(updated?.status).toBe("active");
		});

		it("should successfully update status to suspended", async () => {
			const response = await request(app)
				.put(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({ status: "suspended" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("suspended");
		});
	});

	describe("DELETE /user-organisations/:userId/:organisationId", () => {
		beforeEach(async () => {
			await prisma.userOrganisation.deleteMany();

			await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId,
					status: "active",
				},
			});
		});

		afterEach(async () => {
			await prisma.userOrganisation.deleteMany();
		});

		it("should return 400 when userId is not a number", async () => {
			const response = await request(app)
				.delete(`/user-organisations/abc/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is zero", async () => {
			const response = await request(app)
				.delete(`/user-organisations/0/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is negative", async () => {
			const response = await request(app)
				.delete(`/user-organisations/-1/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not a number", async () => {
			const response = await request(app)
				.delete(`/user-organisations/${userId}/abc`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.delete(`/user-organisations/${userId}/0`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.delete(`/user-organisations/${userId}/-1`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 404 when entry does not exist", async () => {
			await prisma.userOrganisation.deleteMany();

			const response = await request(app)
				.delete(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should successfully delete entry", async () => {
			const response = await request(app)
				.delete(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userId).toBe(userId);
			expect(response.body.data.organisationId).toBe(orgId);

			const deleted = await prisma.userOrganisation.findUnique({
				where: {
					userId_organisationId: {
						userId: userId,
						organisationId: orgId,
					},
				},
			});

			expect(deleted).toBeNull();
		});

		it("should delete associated role assignments when deleting membership", async () => {
			// Create a unique organisation role
			const orgRole = await prisma.organisationRole.create({
				data: { name: `Test Role ${Date.now()}` },
			});

			// The userOrganisation already exists from beforeEach, so just create the role assignment
			await prisma.userOrganisationRoles.create({
				data: {
					userId: userId,
					organisationId: orgId,
					roleId: orgRole.id,
				},
			});

			const roleCountBefore = await prisma.userOrganisationRoles.count({
				where: { userId: userId, organisationId: orgId },
			});
			expect(roleCountBefore).toBe(1);

			const response = await request(app)
				.delete(`/user-organisations/${userId}/${orgId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);

			const roleCountAfter = await prisma.userOrganisationRoles.count({
				where: { userId: userId, organisationId: orgId },
			});
			expect(roleCountAfter).toBe(0);
		});
	});
});
