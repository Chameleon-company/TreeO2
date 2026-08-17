import { customError } from "../../src/utils/errorCodes";
import { UserProjectRoleService } from "../../src/modules/user-project-role/userProjectRole.service";

jest.mock("@prisma/client", () => {
	const mockPrisma = {
		userProjectRole: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		project: {
			findUnique: jest.fn(),
		},
		role: {
			findUnique: jest.fn(),
		},
		userOrganisation: {
			findFirst: jest.fn(),
		},
	};

	class PrismaClientKnownRequestError extends Error {
		code: string;

		constructor(message: string, options: { code: string }) {
			super(message);
			this.code = options.code;
			this.name = "PrismaClientKnownRequestError";
		}
	}

	return {
		PrismaClient: jest.fn(() => mockPrisma),
		Prisma: {
			PrismaClientKnownRequestError,
		},
		__mockPrisma: mockPrisma,
	};
});

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client");

describe("UserProjectRoleService", () => {
	let service: UserProjectRoleService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new UserProjectRoleService();
	});

	describe("getRoles", () => {
		it("returns all user project role assignments", async () => {
			const assignments = [
				{
					userId: 1,
					projectId: 2,
					roleId: 3,
					assignedBy: 1,
				},
			];

			mockPrisma.userProjectRole.findMany.mockResolvedValue(assignments);

			const result = await service.getRoles();

			expect(mockPrisma.userProjectRole.findMany).toHaveBeenCalledWith({
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					project: {
						select: {
							id: true,
							name: true,
						},
					},
					role: {
						select: {
							id: true,
							name: true,
						},
					},
					assignedByUser: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			expect(result).toEqual(assignments);
		});
	});

	describe("assignRole", () => {
		it("assigns a role when all data is valid", async () => {
			const assignment = {
				userId: 1,
				projectId: 2,
				roleId: 3,
				assignedBy: 1,
			};

			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.role.findUnique.mockResolvedValue({
				id: 3,
				name: "FARMER",
			});
			mockPrisma.userOrganisation.findFirst.mockResolvedValue({
				userId: 1,
				organisationId: 4,
			});
			mockPrisma.userProjectRole.findUnique.mockResolvedValue(null);
			mockPrisma.userProjectRole.create.mockResolvedValue(assignment);

			const result = await service.assignRole({
				userId: 1,
				projectId: 2,
				roleId: 3,
				assignedBy: 1,
			});

			expect(mockPrisma.userProjectRole.create).toHaveBeenCalledWith({
				data: {
					userId: 1,
					projectId: 2,
					roleId: 3,
					assignedBy: 1,
				},
				include: expect.any(Object),
			});

			expect(result).toEqual(assignment);
		});

		it("throws DATA_001 when user does not exist", async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");

			await expect(
				service.assignRole({
					userId: 999,
					projectId: 2,
					roleId: 3,
					assignedBy: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User not found",
			});
		});

		it("throws DATA_001 when project does not exist", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.project.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");

			await expect(
				service.assignRole({
					userId: 1,
					projectId: 999,
					roleId: 3,
					assignedBy: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Project not found",
			});
		});

		it("throws DATA_001 when role does not exist", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.role.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");

			await expect(
				service.assignRole({
					userId: 1,
					projectId: 2,
					roleId: 999,
					assignedBy: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Role not found",
			});
		});

		it("throws TENANT_002 when user is not linked to the project organisation", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.role.findUnique.mockResolvedValue({
				id: 3,
				name: "FARMER",
			});
			mockPrisma.userOrganisation.findFirst.mockResolvedValue(null);

			const err = customError("TENANT_002");

			await expect(
				service.assignRole({
					userId: 1,
					projectId: 2,
					roleId: 3,
					assignedBy: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 403,
				code: err.code,
				message: err.message,
				detail:
					"User does not belong to an active organisation linked to this project",
			});
		});

		it("throws DATA_002 when role is already assigned", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.project.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.role.findUnique.mockResolvedValue({
				id: 3,
				name: "FARMER",
			});
			mockPrisma.userOrganisation.findFirst.mockResolvedValue({
				userId: 1,
				organisationId: 4,
			});
			mockPrisma.userProjectRole.findUnique.mockResolvedValue({
				userId: 1,
				projectId: 2,
				roleId: 3,
			});

			const err = customError("DATA_002");

			await expect(
				service.assignRole({
					userId: 1,
					projectId: 2,
					roleId: 3,
					assignedBy: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 409,
				code: err.code,
				message: err.message,
				detail: "Role is already assigned to this user for this project",
			});

			expect(mockPrisma.userProjectRole.create).not.toHaveBeenCalled();
		});
	});

	describe("removeRole", () => {
		it("removes an existing user project role", async () => {
			mockPrisma.userProjectRole.findUnique.mockResolvedValue({
				userId: 1,
				projectId: 2,
				roleId: 3,
			});

			mockPrisma.userProjectRole.delete.mockResolvedValue({
				userId: 1,
				projectId: 2,
				roleId: 3,
			});

			const result = await service.removeRole(1, 2, 3);

			expect(mockPrisma.userProjectRole.delete).toHaveBeenCalledWith({
				where: {
					userId_projectId_roleId: {
						userId: 1,
						projectId: 2,
						roleId: 3,
					},
				},
			});

			expect(result).toEqual({
				message: "User project role removed successfully",
			});
		});

		it("throws DATA_001 when user project role assignment does not exist", async () => {
			mockPrisma.userProjectRole.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");

			await expect(service.removeRole(1, 2, 3)).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User project role assignment not found",
			});

			expect(mockPrisma.userProjectRole.delete).not.toHaveBeenCalled();
		});
	});
});
