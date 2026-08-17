import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../src/app";

const prisma = new PrismaClient();

const ADMIN_TOKEN = process.env.AUTH_DEV_ADMIN_TOKEN!;

const TEST_USER_EMAIL = "api04-role-user@test.com";
const TEST_ORGANISATION_NAME = "API04 Role Test Organisation";
const TEST_PROJECT_NAME = "API04 Role Test Project";

describe("User Project Role Integration Tests", () => {
	let userId: number;
	let projectId: number;
	let roleId: number;
	let organisationId: number;
	let adminRoleId: number;

	beforeAll(async () => {
		// Clean up any data left from an earlier local test run.
		const existingUser = await prisma.user.findUnique({
			where: { email: TEST_USER_EMAIL },
		});

		if (existingUser) {
			await prisma.userProjectRole.deleteMany({
				where: { userId: existingUser.id },
			});

			await prisma.userOrganisation.deleteMany({
				where: { userId: existingUser.id },
			});

			if (existingUser.id !== 1) {
				await prisma.user.delete({
					where: { id: existingUser.id },
				});
			} else {
				await prisma.user.update({
					where: { id: 1 },
					data: { email: null },
				});
			}
		}

		const existingProject = await prisma.project.findFirst({
			where: { name: TEST_PROJECT_NAME },
		});

		if (existingProject) {
			await prisma.userProjectRole.deleteMany({
				where: { projectId: existingProject.id },
			});

			await prisma.projectOrganisation.deleteMany({
				where: { projectId: existingProject.id },
			});

			await prisma.project.delete({
				where: { id: existingProject.id },
			});
		}

		const existingOrganisation = await prisma.organisation.findFirst({
			where: { name: TEST_ORGANISATION_NAME },
		});

		if (existingOrganisation) {
			await prisma.userOrganisation.deleteMany({
				where: { organisationId: existingOrganisation.id },
			});

			await prisma.projectOrganisation.deleteMany({
				where: { organisationId: existingOrganisation.id },
			});

			await prisma.organisation.delete({
				where: { id: existingOrganisation.id },
			});
		}

		const adminRole = await prisma.role.upsert({
			where: { name: "ADMIN" },
			update: {},
			create: { name: "ADMIN" },
		});

		adminRoleId = adminRole.id;

		const projectRole = await prisma.role.upsert({
			where: { name: "FARMER" },
			update: {},
			create: { name: "FARMER" },
		});

		roleId = projectRole.id;

		const organisation = await prisma.organisation.create({
			data: {
				name: TEST_ORGANISATION_NAME,
			},
		});

		organisationId = organisation.id;

		const project = await prisma.project.create({
			data: {
				ownerOrganisationId: organisationId,
				name: TEST_PROJECT_NAME,
				description: "Project used for API04 integration tests",
				isActive: true,
			},
		});

		projectId = project.id;

		const user = await prisma.user.create({
			data: {
				name: "API04 Role Test User",
				email: TEST_USER_EMAIL,
				roleId,
			},
		});

		userId = user.id;

		/*
		 * AUTH_DEV_ADMIN_TOKEN authenticates as user id 1.
		 * UserProjectRole.assignedBy has a foreign key to User,
		 * so ensure user id 1 exists in the test database.
		 */
		const assignedByUser = await prisma.user.findUnique({
			where: { id: 1 },
		});

		if (!assignedByUser) {
			await prisma.user.create({
				data: {
					id: 1,
					name: "API04 Integration Admin",
					roleId: adminRoleId,
				},
			});
		}

		await prisma.userOrganisation.create({
			data: {
				userId,
				organisationId,
				status: "active",
			},
		});

		await prisma.projectOrganisation.create({
			data: {
				projectId,
				organisationId,
			},
		});
	});

	beforeEach(async () => {
		await prisma.userProjectRole.deleteMany({
			where: {
				userId,
				projectId,
			},
		});

		await prisma.userOrganisation.upsert({
			where: {
				userId_organisationId: {
					userId,
					organisationId,
				},
			},
			update: {
				status: "active",
			},
			create: {
				userId,
				organisationId,
				status: "active",
			},
		});

		await prisma.projectOrganisation.upsert({
			where: {
				projectId_organisationId: {
					projectId,
					organisationId,
				},
			},
			update: {},
			create: {
				projectId,
				organisationId,
			},
		});
	});

	afterAll(async () => {
		await prisma.userProjectRole.deleteMany({
			where: {
				OR: [{ userId }, { projectId }],
			},
		});

		await prisma.userOrganisation.deleteMany({
			where: {
				userId,
				organisationId,
			},
		});

		await prisma.projectOrganisation.deleteMany({
			where: {
				projectId,
				organisationId,
			},
		});

		await prisma.project.deleteMany({
			where: { id: projectId },
		});

		if (userId !== 1) {
			await prisma.user.deleteMany({
				where: { id: userId },
			});
		} else {
			await prisma.user.update({
				where: { id: 1 },
				data: {
					name: "API04 Integration Admin",
					email: null,
					roleId: adminRoleId,
				},
			});
		}

		await prisma.organisation.deleteMany({
			where: { id: organisationId },
		});

		await prisma.$disconnect();
	});

	describe("GET /user-project-roles", () => {
		it("returns 401 when no token is provided", async () => {
			const response = await request(app).get("/user-project-roles");

			expect(response.status).toBe(401);
		});

		it("returns user project role assignments", async () => {
			await prisma.userProjectRole.create({
				data: {
					userId,
					projectId,
					roleId,
					assignedBy: 1,
				},
			});

			const response = await request(app)
				.get("/user-project-roles")
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userId,
						projectId,
						roleId,
					}),
				]),
			);
		});
	});

	describe("POST /user-project-roles", () => {
		it("returns 401 when no token is provided", async () => {
			const response = await request(app).post("/user-project-roles").send({
				userId,
				projectId,
				roleId,
			});

			expect(response.status).toBe(401);
		});

		it("returns 201 and assigns a project role", async () => {
			const response = await request(app)
				.post("/user-project-roles")
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
				.send({
					userId,
					projectId,
					roleId,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.userId).toBe(userId);
			expect(response.body.data.projectId).toBe(projectId);
			expect(response.body.data.roleId).toBe(roleId);
			expect(response.body.data.assignedBy).toBe(1);
		});

		it("returns 400 for an invalid payload", async () => {
			const response = await request(app)
				.post("/user-project-roles")
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
				.send({
					userId: 0,
					projectId,
					roleId,
				});

			expect(response.status).toBe(400);
		});

		it("returns 403 when user is not linked to the project organisation", async () => {
			await prisma.userOrganisation.delete({
				where: {
					userId_organisationId: {
						userId,
						organisationId,
					},
				},
			});

			const response = await request(app)
				.post("/user-project-roles")
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
				.send({
					userId,
					projectId,
					roleId,
				});

			expect(response.status).toBe(403);
		});

		it("returns 409 when the role is already assigned", async () => {
			await prisma.userProjectRole.create({
				data: {
					userId,
					projectId,
					roleId,
					assignedBy: 1,
				},
			});

			const response = await request(app)
				.post("/user-project-roles")
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
				.send({
					userId,
					projectId,
					roleId,
				});

			expect(response.status).toBe(409);
		});
	});

	describe("DELETE /user-project-roles/:user_id/:project_id/:role_id", () => {
		it("removes an existing user project role", async () => {
			await prisma.userProjectRole.create({
				data: {
					userId,
					projectId,
					roleId,
					assignedBy: 1,
				},
			});

			const response = await request(app)
				.delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			const assignment = await prisma.userProjectRole.findUnique({
				where: {
					userId_projectId_roleId: {
						userId,
						projectId,
						roleId,
					},
				},
			});

			expect(assignment).toBeNull();
		});

		it("returns 404 when the assignment does not exist", async () => {
			const response = await request(app)
				.delete(`/user-project-roles/${userId}/${projectId}/${roleId}`)
				.set("Authorization", `Bearer ${ADMIN_TOKEN}`);

			expect(response.status).toBe(404);
		});
	});
});
