import { customError } from "../../src/utils/errorCodes";
import { userOrganisationRolesService } from "../../src/modules/user-organisation-roles/userOrganisationRoles.service";
import {
	AddUserOrganisationRoleReq,
	RemoveUserOrganisationRoleReq,
} from "../../src/modules/user-organisation-roles/userOrganisationRoles.schema";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

jest.mock("@prisma/client", () => {
	const mockPrisma = {
		userOrganisationRoles: {
			findUnique: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		userOrganisation: {
			findUnique: jest.fn(),
		},
		organisationRole: {
			findUnique: jest.fn(),
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

const { __mockPrisma: mockPrisma } = jest.requireMock<any>("@prisma/client");

// Schema validation tests
describe("UserOrganisationRoles Schemas", () => {
	describe("AddUserOrganisationRoleReq", () => {
		it("should validate a valid request body", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					roleId: 3,
				},
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.body).toEqual({
				userId: 1,
				organisationId: 2,
				roleId: 3,
			});
		});

		it("should reject non-positive userId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: -1,
					organisationId: 2,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive organisationId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: -1,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive roleId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					roleId: -1,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as userId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 0,
					organisationId: 2,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as organisationId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 0,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as roleId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					roleId: 0,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer userId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1.5,
					organisationId: 2,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer organisationId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2.5,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer roleId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					roleId: 3.5,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing userId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					organisationId: 2,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					roleId: 3,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing roleId", () => {
			const result = AddUserOrganisationRoleReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
				},
			});

			expect(result.success).toBe(false);
		});
	});

	describe("RemoveUserOrganisationRoleReq", () => {
		it("should validate valid params with string input", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "2", roleId: "3" },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.params.userId).toBe(1);
			expect(result.data?.params.organisationId).toBe(2);
			expect(result.data?.params.roleId).toBe(3);
		});

		it("should validate valid params with number input", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: 1, organisationId: 2, roleId: 3 },
			});

			expect(result.success).toBe(true);
		});

		it("should reject zero userId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "0", organisationId: "2", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative userId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "-1", organisationId: "2", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero organisationId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "0", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative organisationId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "-2", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero roleId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "2", roleId: "0" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative roleId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "2", roleId: "-3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric userId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "abc", organisationId: "2", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric organisationId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "xyz", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric roleId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "2", roleId: "abc" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing userId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { organisationId: "2", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", roleId: "3" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing roleId", () => {
			const result = RemoveUserOrganisationRoleReq.safeParse({
				params: { userId: "1", organisationId: "2" },
			});

			expect(result.success).toBe(false);
		});
	});
});

// Unit tests for UserOrganisationRolesService business logic
describe("UserOrganisationRolesService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("addUserOrganisationRole", () => {
		it("should create a role assignment successfully", async () => {
			const created = {
				userId: 1,
				organisationId: 2,
				roleId: 3,
			};

			mockPrisma.userOrganisation.findUnique.mockResolvedValue({
				userId: 1,
				organisationId: 2,
			});
			mockPrisma.organisationRole.findUnique.mockResolvedValue({ id: 3 });
			mockPrisma.userOrganisationRoles.create.mockResolvedValue(created);

			const result = await userOrganisationRolesService.addUserOrganisationRole(
				1,
				2,
				3,
			);

			expect(mockPrisma.userOrganisation.findUnique).toHaveBeenCalledWith({
				where: {
					userId_organisationId: {
						userId: 1,
						organisationId: 2,
					},
				},
				select: { userId: true, organisationId: true },
			});
			expect(mockPrisma.organisationRole.findUnique).toHaveBeenCalledWith({
				where: { id: 3 },
				select: { id: true },
			});
			expect(mockPrisma.userOrganisationRoles.create).toHaveBeenCalledWith({
				data: {
					userId: 1,
					organisationId: 2,
					roleId: 3,
				},
			});
			expect(result).toEqual(created);
		});

		it("should throw DATA_001 when user-organisation membership does not exist", async () => {
			mockPrisma.userOrganisation.findUnique.mockResolvedValue(null);
			mockPrisma.organisationRole.findUnique.mockResolvedValue({ id: 3 });

			const err = customError("DATA_001");
			await expect(
				userOrganisationRolesService.addUserOrganisationRole(999, 2, 3),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User organisation membership not found",
			});

			expect(mockPrisma.userOrganisationRoles.create).not.toHaveBeenCalled();
		});

		it("should throw DATA_001 when organisation role does not exist", async () => {
			mockPrisma.userOrganisation.findUnique.mockResolvedValue({
				userId: 1,
				organisationId: 2,
			});
			mockPrisma.organisationRole.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				userOrganisationRolesService.addUserOrganisationRole(1, 2, 999),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Organisation role not found",
			});

			expect(mockPrisma.userOrganisationRoles.create).not.toHaveBeenCalled();
		});
	});

	describe("removeUserOrganisationRole", () => {
		it("should delete a role assignment successfully", async () => {
			const existingEntry = {
				userId: 1,
				organisationId: 2,
				roleId: 3,
			};

			mockPrisma.userOrganisationRoles.findUnique.mockResolvedValue(
				existingEntry,
			);
			mockPrisma.userOrganisationRoles.delete.mockResolvedValue(existingEntry);

			const result =
				await userOrganisationRolesService.removeUserOrganisationRole(1, 2, 3);

			expect(mockPrisma.userOrganisationRoles.findUnique).toHaveBeenCalledWith({
				where: {
					userId_organisationId_roleId: {
						userId: 1,
						organisationId: 2,
						roleId: 3,
					},
				},
				select: {
					userId: true,
					organisationId: true,
					roleId: true,
				},
			});
			expect(mockPrisma.userOrganisationRoles.delete).toHaveBeenCalledWith({
				where: {
					userId_organisationId_roleId: {
						userId: 1,
						organisationId: 2,
						roleId: 3,
					},
				},
			});
			expect(result).toEqual(existingEntry);
		});

		it("should throw DATA_001 when role assignment does not exist", async () => {
			mockPrisma.userOrganisationRoles.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				userOrganisationRolesService.removeUserOrganisationRole(1, 2, 3),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User organisation role assignment not found",
			});

			expect(mockPrisma.userOrganisationRoles.delete).not.toHaveBeenCalled();
		});
	});
});
