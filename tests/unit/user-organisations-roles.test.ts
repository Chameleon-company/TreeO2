import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { userOrganisationRolesService } from "../../src/modules/user-organisation-roles/userOrganisationRoles.service";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";

jest.mock("../../src/lib/prisma", () => ({
	prisma: {
		userOrganisationRoles: {
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

const mockedUserOrganisationRole = prisma.userOrganisationRoles as {
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

const buildUserOrganisationRole = (overrides = {}) => ({
	userId: 1,
	organisationId: 1,
	roleId: 1,
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

describe("UserOrganisationRolesService - Unit Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("addUserOrganisationRole", () => {
		it("should return the created user organisation role", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisationRole.create.mockResolvedValue(buildUserOrganisationRole());

			const result = await userOrganisationRolesService.addUserOrganisationRole(1, 1, 1);

			expect(result.userId).toBe(1);
			expect(result.organisationId).toBe(1);
			expect(result.roleId).toBe(1);
			expect(mockedUserOrganisationRole.create).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when user is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(null);
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			await expect(
				userOrganisationRolesService.addUserOrganisationRole(1, 1, 1)
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when organisation is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				userOrganisationRolesService.addUserOrganisationRole(1, 1, 1)
			).rejects.toThrow(AppError);
		});
	});

	describe("removeUserOrganisationRole", () => {
		it("should return the created user organisation role", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisationRole.delete.mockResolvedValue(buildUserOrganisationRole());

			const result = await userOrganisationRolesService.removeUserOrganisationRole(1, 1, 1);

			expect(result.userId).toBe(1);
			expect(result.organisationId).toBe(1);
			expect(result.roleId).toBe(1);
			expect(mockedUserOrganisationRole.delete).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when user is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(null);
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			await expect(
				userOrganisationRolesService.removeUserOrganisationRole(1, 1, 1)
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when organisation is not found", async () => {
			mockedUser.findUnique.mockResolvedValue(buildUser());
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				userOrganisationRolesService.removeUserOrganisationRole(1, 1, 1)
			).rejects.toThrow(AppError);
		});
	});
});
