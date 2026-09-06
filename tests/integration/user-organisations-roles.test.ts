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
import { PrismaClient } from "@prisma/client";
import app from "../../src/app";
import { customError } from "../../src/utils/errorCodes";

const prisma = new PrismaClient();

const TOKENS = {
	ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
};

describe("User Organisation Roles Integration Tests", () => {
	let userId: number;
	let userId2: number;
	let orgId: number;
	let orgId2: number;
	let orgRoleId: number;
	let orgRoleId2: number;

	beforeAll(async () => {
		// Clean up in reverse dependency order
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

		// Create test users
		const user1 = await prisma.user.create({
			data: {
				name: "Integration Test User 1",
				email: `user1-uor-${Date.now()}@example.com`,
				passwordHash: "$2b$10$examplehash",
				roleId: role.id,
			},
		});
		userId = user1.id;

		const user2 = await prisma.user.create({
			data: {
				name: "Integration Test User 2",
				email: `user2-uor-${Date.now()}@example.com`,
				passwordHash: "$2b$10$examplehash",
				roleId: role.id,
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

		// Create test organisation roles
		const orgRole1 = await prisma.organisationRole.create({
			data: { name: "Test Role 1" },
		});
		orgRoleId = orgRole1.id;

		const orgRole2 = await prisma.organisationRole.create({
			data: { name: "Test Role 2" },
		});
		orgRoleId2 = orgRole2.id;

		// Create user-organisation memberships
		await prisma.userOrganisation.create({
			data: {
				userId: userId,
				organisationId: orgId,
				status: "active",
			},
		});

		await prisma.userOrganisation.create({
			data: {
				userId: userId2,
				organisationId: orgId2,
				status: "active",
			},
		});
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
		await prisma.user.deleteMany();
		await prisma.organisation.deleteMany();
		await prisma.organisationRole.deleteMany();
		await prisma.role.deleteMany();
		await prisma.$disconnect();
	});

	// ========================================================================
	// POST /user-organisation-roles
	// ========================================================================

	describe("POST /user-organisation-roles", () => {
		it("should return 201 and create a role assignment", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userId).toBe(userId);
			expect(response.body.data.organisationId).toBe(orgId);
			expect(response.body.data.roleId).toBe(orgRoleId);
		});

		it("should return 201 when assigning a second role to the same user-org", async () => {
			// First role
			await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			// Second role
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId2,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.roleId).toBe(orgRoleId2);
		});

		it("should return 400 when userId is missing", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					organisationId: orgId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is missing", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is missing", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is negative", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: -1,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: -1,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is negative", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: -1,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is zero", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 0,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: 0,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is zero", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: 0,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is not an integer", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 1.5,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not an integer", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: 2.5,
					roleId: orgRoleId,
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is not an integer", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: 3.5,
				});

			expect(response.status).toBe(400);
		});

		it("should return 404 when user-organisation membership does not exist", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: 999999,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 404 when organisation role does not exist", async () => {
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: 999999,
				});

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should return 409 when duplicate role assignment exists", async () => {
			// Create the assignment first
			await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			// Try to create the same assignment again
			const response = await request(app)
				.post("/user-organisation-roles")
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
				.send({
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				});

			const err = customError("DATA_002");
			expect(response.status).toBe(409);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});
	});

	// ========================================================================
	// DELETE /user-organisation-roles/:userId/:organisationId/:roleId
	// ========================================================================

	describe("DELETE /user-organisation-roles/:userId/:organisationId/:roleId", () => {
		beforeEach(async () => {
			await prisma.userOrganisationRoles.create({
				data: {
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				},
			});
		});

		afterEach(async () => {
			await prisma.userOrganisationRoles.deleteMany();
		});

		it("should return 400 when userId is not a number", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/abc/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is zero", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/0/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when userId is negative", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/-1/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is not a number", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/abc/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is zero", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/0/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when organisationId is negative", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/-1/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is not a number", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/abc`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is zero", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/0`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 400 when roleId is negative", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/-1`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(400);
		});

		it("should return 404 when the role assignment does not exist", async () => {
			// Delete the assignment that beforeEach created
			await prisma.userOrganisationRoles.deleteMany();

			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			const err = customError("DATA_001");
			expect(response.status).toBe(404);
			expect(response.body.error.code).toBe(err.code);
			expect(response.body.error.message).toBe(err.message);
		});

		it("should successfully delete the role assignment", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userId).toBe(userId);
			expect(response.body.data.organisationId).toBe(orgId);
			expect(response.body.data.roleId).toBe(orgRoleId);

			// Verify the assignment was actually deleted
			const deleted = await prisma.userOrganisationRoles.findUnique({
				where: {
					userId_organisationId_roleId: {
						userId: userId,
						organisationId: orgId,
						roleId: orgRoleId,
					},
				},
			});

			expect(deleted).toBeNull();
		});

		it("should only delete the specific role assignment, not the membership", async () => {
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);

			// Verify the user-organisation membership still exists
			const membership = await prisma.userOrganisation.findUnique({
				where: {
					userId_organisationId: {
						userId: userId,
						organisationId: orgId,
					},
				},
			});

			expect(membership).not.toBeNull();
			expect(membership?.userId).toBe(userId);
			expect(membership?.organisationId).toBe(orgId);
		});

		it("should allow deleting one role while keeping another role assignment", async () => {
			// Add a second role assignment
			await prisma.userOrganisationRoles.create({
				data: {
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId2,
				},
			});

			// Verify both exist
			const countBefore = await prisma.userOrganisationRoles.count({
				where: { userId: userId, organisationId: orgId },
			});
			expect(countBefore).toBe(2);

			// Delete the first role
			const response = await request(app)
				.delete(`/user-organisation-roles/${userId}/${orgId}/${orgRoleId}`)
				.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

			expect(response.status).toBe(200);

			// Verify only the second role remains
			const remaining = await prisma.userOrganisationRoles.findMany({
				where: { userId: userId, organisationId: orgId },
			});

			expect(remaining.length).toBe(1);
			expect(remaining[0].roleId).toBe(orgRoleId2);
		});
	});
});
