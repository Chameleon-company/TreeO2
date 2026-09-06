import { customError } from "../../src/utils/errorCodes";
import { userOrganisationsService } from "../../src/modules/user-organisations/userOrganisations.service";
import {
	AddUserOrganisationReq,
	DeleteUserOrganisationReq,
	ListUserOrganisationReq,
	UpdateUserOrganisationReq,
} from "../../src/modules/user-organisations/userOrganisations.schema";
import { Status } from "@prisma/client";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

jest.mock("@prisma/client", () => {
	const mockPrisma = {
		userOrganisation: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		organisation: {
			findUnique: jest.fn(),
		},
		userOrganisationRoles: {
			deleteMany: jest.fn(),
		},
		$transaction: jest.fn((cb: any) => cb(mockPrisma)),
	};

	class PrismaClientKnownRequestError extends Error {
		code: string;

		constructor(message: string, options: { code: string }) {
			super(message);
			this.code = options.code;
			this.name = "PrismaClientKnownRequestError";
		}
	}

	const Status = {
		invited: "invited",
		active: "active",
		suspended: "suspended",
	} as const;

	return {
		PrismaClient: jest.fn(() => mockPrisma),
		Prisma: {
			PrismaClientKnownRequestError,
		},
		Status,
		__mockPrisma: mockPrisma,
	};
});

const { __mockPrisma: mockPrisma } = jest.requireMock<any>("@prisma/client");

// Schema validation tests
describe("UserOrganisations Schemas", () => {
	describe("ListUserOrganisationReq", () => {
		it("should validate a valid request with query params", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: 10 },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.query.page).toBe(1);
			expect(result.data?.query.limit).toBe(10);
		});

		it("should default page to 1 when omitted", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { limit: 10 },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.query.page).toBe(1);
		});

		it("should default limit to 10 when omitted", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1 },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.query.limit).toBe(10);
		});

		it("should default both page and limit when query is empty", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: {},
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.query.page).toBe(1);
			expect(result.data?.query.limit).toBe(10);
		});

		it("should reject page as zero", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 0, limit: 10 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject page as negative", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: -1, limit: 10 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject limit exceeding maximum", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: 101 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject limit as zero", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: 0 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject limit as negative", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: -5 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer page", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1.5, limit: 10 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer limit", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: 10.5 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric page string", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: "abc", limit: 10 },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric limit string", () => {
			const result = ListUserOrganisationReq.safeParse({
				query: { page: 1, limit: "xyz" },
			});

			expect(result.success).toBe(false);
		});
	});

	describe("AddUserOrganisationReq", () => {
		it("should validate a valid request body", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					status: "active",
				},
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.body).toEqual({
				userId: 1,
				organisationId: 2,
				status: "active",
			});
		});

		it("should default status to 'active' when omitted", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
				},
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.body.status).toBe("active");
		});

		it("should validate all valid status values", () => {
			const validStatuses: Status[] = ["invited", "active", "suspended"];

			for (const status of validStatuses) {
				const result = AddUserOrganisationReq.safeParse({
					body: {
						userId: 1,
						organisationId: 2,
						status,
					},
				});

				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid status values", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
					organisationId: 2,
					status: "invalid_status",
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive userId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: -1,
					organisationId: 2,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive organisationId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
					organisationId: -1,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as userId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 0,
					organisationId: 2,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as organisationId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
					organisationId: 0,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing userId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					organisationId: 2,
				},
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = AddUserOrganisationReq.safeParse({
				body: {
					userId: 1,
				},
			});

			expect(result.success).toBe(false);
		});
	});

	describe("UpdateUserOrganisationReq", () => {
		it("should validate a valid request with params and body", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "2" },
				body: { status: "active" },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.params.userId).toBe(1);
			expect(result.data?.params.organisationId).toBe(2);
			expect(result.data?.body.status).toBe("active");
		});

		it("should validate params with number input", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: 1, organisationId: 2 },
				body: { status: "active" },
			});

			expect(result.success).toBe(true);
		});

		it("should reject invalid userId in params", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: "abc", organisationId: "2" },
				body: { status: "active" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid organisationId in params", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "xyz" },
				body: { status: "active" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing status in body", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "2" },
				body: {},
			});

			expect(result.success).toBe(false);
		});

		it("should reject invalid status in body", () => {
			const result = UpdateUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "2" },
				body: { status: "invalid_status" },
			});

			expect(result.success).toBe(false);
		});
	});

	describe("DeleteUserOrganisationReq", () => {
		it("should validate valid params with string input", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "2" },
			});

			expect(result.success).toBe(true);
			expect(result.data).not.toBeUndefined();
			expect(result.data?.params.userId).toBe(1);
			expect(result.data?.params.organisationId).toBe(2);
		});

		it("should validate valid params with number input", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: 1, organisationId: 2 },
			});

			expect(result.success).toBe(true);
		});

		it("should reject zero userId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "0", organisationId: "2" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative userId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "-1", organisationId: "2" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero organisationId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "0" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject negative organisationId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "-2" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric userId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "abc", organisationId: "2" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric organisationId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "1", organisationId: "xyz" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing userId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { organisationId: "2" },
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = DeleteUserOrganisationReq.safeParse({
				params: { userId: "1" },
			});

			expect(result.success).toBe(false);
		});
	});
});

// Unit tests for UserOrganisationsService business logic
describe("UserOrganisationsService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("listUserOrganisations", () => {
		it("should return paginated user organisations", async () => {
			const entries = [
				{ userId: 1, organisationId: 1, status: "active" as const },
				{ userId: 2, organisationId: 1, status: "invited" as const },
			];

			mockPrisma.userOrganisation.findMany.mockResolvedValue(entries);
			mockPrisma.userOrganisation.count.mockResolvedValue(2);

			const result = await userOrganisationsService.listUserOrganisations(
				1,
				10,
			);

			expect(mockPrisma.userOrganisation.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				orderBy: { createdAt: "desc" },
			});
			expect(mockPrisma.userOrganisation.count).toHaveBeenCalled();
			expect(result.data).toEqual(entries);
			expect(result.pagination).toEqual({
				page: 1,
				limit: 10,
				total: 2,
				totalPages: 1,
			});
		});

		it("should return correct pagination for page 2", async () => {
			mockPrisma.userOrganisation.findMany.mockResolvedValue([]);
			mockPrisma.userOrganisation.count.mockResolvedValue(25);

			const result = await userOrganisationsService.listUserOrganisations(
				3,
				10,
			);

			expect(mockPrisma.userOrganisation.findMany).toHaveBeenCalledWith({
				skip: 20,
				take: 10,
				orderBy: { createdAt: "desc" },
			});
			expect(result.pagination.totalPages).toBe(3);
		});

		it("should return empty array when no entries exist", async () => {
			mockPrisma.userOrganisation.findMany.mockResolvedValue([]);
			mockPrisma.userOrganisation.count.mockResolvedValue(0);

			const result = await userOrganisationsService.listUserOrganisations(
				1,
				10,
			);

			expect(result.data).toEqual([]);
			expect(result.pagination.total).toBe(0);
			expect(result.pagination.totalPages).toBe(0);
		});

		it("should return correct page size", async () => {
			const entries = [
				{ userId: 1, organisationId: 1, status: "active" as const },
				{ userId: 2, organisationId: 1, status: "invited" as const },
			];

			mockPrisma.userOrganisation.findMany.mockResolvedValue([entries[0]]);
			mockPrisma.userOrganisation.count.mockResolvedValue(2);

			const result = await userOrganisationsService.listUserOrganisations(1, 1);

			expect(mockPrisma.userOrganisation.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 1,
				orderBy: { createdAt: "desc" },
			});
			expect(mockPrisma.userOrganisation.count).toHaveBeenCalled();
			expect(result.data).toEqual([entries[0]]);
			expect(result.pagination).toEqual({
				page: 1,
				limit: 1,
				total: 2,
				totalPages: 2,
			});
		});

		it("should skip the correct page size", async () => {
			const entries = [
				{ userId: 1, organisationId: 1, status: "active" as const },
				{ userId: 2, organisationId: 1, status: "invited" as const },
			];

			mockPrisma.userOrganisation.findMany.mockResolvedValue([entries[1]]);
			mockPrisma.userOrganisation.count.mockResolvedValue(2);

			const result = await userOrganisationsService.listUserOrganisations(2, 1);

			expect(mockPrisma.userOrganisation.findMany).toHaveBeenCalledWith({
				skip: 1,
				take: 1,
				orderBy: { createdAt: "desc" },
			});
			expect(mockPrisma.userOrganisation.count).toHaveBeenCalled();
			expect(result.data).toEqual([entries[1]]);
			expect(result.pagination).toEqual({
				page: 2,
				limit: 1,
				total: 2,
				totalPages: 2,
			});
		});
	});

	describe("addUserOrganisation", () => {
		it("should create a user-organisation entry successfully", async () => {
			const created = {
				userId: 1,
				organisationId: 2,
				status: "active" as const,
			};

			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.userOrganisation.create.mockResolvedValue(created);

			const result = await userOrganisationsService.addUserOrganisation(
				1,
				2,
				"active",
			);

			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { id: true },
			});
			expect(mockPrisma.organisation.findUnique).toHaveBeenCalledWith({
				where: { id: 2 },
				select: { id: true },
			});
			expect(mockPrisma.userOrganisation.create).toHaveBeenCalledWith({
				data: {
					userId: 1,
					organisationId: 2,
					status: "active",
				},
			});
			expect(result).toEqual(created);
		});

		it("should create with status invited", async () => {
			const created = {
				userId: 1,
				organisationId: 2,
				status: "invited" as const,
			};

			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.userOrganisation.create.mockResolvedValue(created);

			const result = await userOrganisationsService.addUserOrganisation(
				1,
				2,
				"invited",
			);

			expect(result.status).toBe("invited");
		});

		it("should create with status suspended", async () => {
			const created = {
				userId: 1,
				organisationId: 2,
				status: "suspended" as const,
			};

			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.userOrganisation.create.mockResolvedValue(created);

			const result = await userOrganisationsService.addUserOrganisation(
				1,
				2,
				"suspended",
			);

			expect(result.status).toBe("suspended");
		});

		it("should throw DATA_001 when user does not exist", async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null);
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });

			const err = customError("DATA_001");
			await expect(
				userOrganisationsService.addUserOrganisation(999, 2, "active"),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User not found",
			});

			expect(mockPrisma.userOrganisation.create).not.toHaveBeenCalled();
		});

		it("should throw DATA_001 when organisation does not exist", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				userOrganisationsService.addUserOrganisation(1, 999, "active"),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Organisation not found",
			});

			expect(mockPrisma.userOrganisation.create).not.toHaveBeenCalled();
		});
	});

	describe("updateUserOrganisation", () => {
		it("should update a user-organisation entry successfully", async () => {
			const updated = {
				userId: 1,
				organisationId: 2,
				status: "active" as const,
			};

			mockPrisma.userOrganisation.findUnique.mockResolvedValue({
				userId: 1,
				organisationId: 2,
			});
			mockPrisma.userOrganisation.update.mockResolvedValue(updated);

			const result = await userOrganisationsService.updateUserOrganisation(
				1,
				2,
				"active",
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
			expect(mockPrisma.userOrganisation.update).toHaveBeenCalledWith({
				where: {
					userId_organisationId: {
						userId: 1,
						organisationId: 2,
					},
				},
				data: { status: "active" },
			});
			expect(result).toEqual(updated);
		});

		it("should throw DATA_001 when entry does not exist", async () => {
			mockPrisma.userOrganisation.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				userOrganisationsService.updateUserOrganisation(1, 2, "active"),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User organisation membership not found",
			});

			expect(mockPrisma.userOrganisation.update).not.toHaveBeenCalled();
		});
	});

	describe("deleteUserOrganisation", () => {
		it("should delete a user-organisation entry and associated roles", async () => {
			const existingEntry = {
				userId: 1,
				organisationId: 2,
				status: "active" as const,
			};

			mockPrisma.userOrganisation.findUnique.mockResolvedValue(existingEntry);
			mockPrisma.userOrganisationRoles.deleteMany.mockResolvedValue({
				count: 1,
			});
			mockPrisma.userOrganisation.delete.mockResolvedValue(existingEntry);

			const result = await userOrganisationsService.deleteUserOrganisation(
				1,
				2,
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
			expect(mockPrisma.userOrganisationRoles.deleteMany).toHaveBeenCalledWith({
				where: {
					userId: 1,
					organisationId: 2,
				},
			});
			expect(result).toEqual(existingEntry);
		});

		it("should delete even when no roles exist", async () => {
			const existingEntry = {
				userId: 1,
				organisationId: 2,
				status: "active" as const,
			};

			mockPrisma.userOrganisation.findUnique.mockResolvedValue(existingEntry);
			mockPrisma.userOrganisationRoles.deleteMany.mockResolvedValue({
				count: 0,
			});
			mockPrisma.userOrganisation.delete.mockResolvedValue(existingEntry);

			const result = await userOrganisationsService.deleteUserOrganisation(
				1,
				2,
			);

			expect(result).toEqual(existingEntry);
		});

		it("should throw DATA_001 when entry does not exist", async () => {
			mockPrisma.userOrganisation.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				userOrganisationsService.deleteUserOrganisation(1, 2),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "User organisation membership not found",
			});

			expect(
				mockPrisma.userOrganisationRoles.deleteMany,
			).not.toHaveBeenCalled();
			expect(mockPrisma.userOrganisation.delete).not.toHaveBeenCalled();
		});
	});
});
