import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { userOrganisationsService } from "../../src/modules/user-organisations/userOrganisations.service";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";

jest.mock("../../src/lib/prisma", () => ({
	prisma: {
		userOrganisation: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		organisation: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		}
	},
}));

const mockedUserOrganisation = prisma.userOrganisation as {
	findMany: jest.MockedFunction<any>;
	findUnique: jest.MockedFunction<any>;
	findFirst: jest.MockedFunction<any>;
	create: jest.MockedFunction<any>;
	update: jest.MockedFunction<any>;
	delete: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
}

const mockedUser = prisma.user as {
	findMany: jest.MockedFunction<any>;
	findUnique: jest.MockedFunction<any>;
	findFirst: jest.MockedFunction<any>;
	create: jest.MockedFunction<any>;
	update: jest.MockedFunction<any>;
	delete: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
}

const mockedOrganisation = prisma.organisation as {
	findMany: jest.MockedFunction<any>;
	findUnique: jest.MockedFunction<any>;
	findFirst: jest.MockedFunction<any>;
	create: jest.MockedFunction<any>;
	update: jest.MockedFunction<any>;
	delete: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
}

const buildUserOrganisation = (overrides = {}) => ({
	userId: 1,
	organisationId: 1,
	status: "invited",
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	...overrides,
});

const buildUser = (overrides = {}) => ({
	id: 1,
	...overrides,
});

const buildOrganisation = (overrides = {}) => ({
	id: 1,
	...overrides,
});

describe("UserOrganisationsService - Unit Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getUserOrganisations", () => {
		it("should return all user organisation memberships", async () => {
			mockedUserOrganisation.findMany.mockResolvedValue([buildUserOrganisation()]);

			const result = await userOrganisationsService.getUserOrganisations()

			expect(result.length).toBe(1);
		});
	})

	describe("addUserToOrganisation", () => {
		it("should return the created user organisation membership", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisation.create.mockResolvedValue(buildUserOrganisation());

			const result = await userOrganisationsService.addUserToOrganisation(1, 1);

			expect(result.userId).toBe(1);
			expect(result.organisationId).toBe(1);
			expect(result.status).toBe("invited");
			expect(mockedUserOrganisation.create).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when user is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(null);
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			await expect(
				userOrganisationsService.addUserToOrganisation(1, 1)
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when organisation is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				userOrganisationsService.addUserToOrganisation(1, 1)
			).rejects.toThrow(AppError);
		});
	});

	describe("updateUserMembershipStatus", () => {
		it("should return the updated user organisation membership", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisation.update.mockResolvedValue(buildUserOrganisation({status: "active"}));

			const result = await userOrganisationsService.updateUserMembershipStatus(1, 1, "active");

			expect(result.userId).toBe(1);
			expect(result.organisationId).toBe(1);
			expect(result.status).toBe("active");
			expect(mockedUserOrganisation.update).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when user is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(null);
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			await expect(
				userOrganisationsService.updateUserMembershipStatus(1, 1, "active")
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when organisation is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				userOrganisationsService.updateUserMembershipStatus(1, 1, "active")
			).rejects.toThrow(AppError);
		});
	});

	describe("removeUserMembershipStatus", () => {
		it("should return the removed user organisation membership", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisation.delete.mockResolvedValue(buildUserOrganisation());

			const result = await userOrganisationsService.removeUserMembershipStatus(1, 1);

			expect(result.userId).toBe(1);
			expect(result.organisationId).toBe(1);
			expect(result.status).toBe("invited");
			expect(mockedUserOrganisation.delete).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when user is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(null);
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			await expect(
				userOrganisationsService.updateUserMembershipStatus(1, 1, "active")
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when organisation is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				userOrganisationsService.updateUserMembershipStatus(1, 1, "active")
			).rejects.toThrow(AppError);
		});
	});
});
