import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { organisationsService } from "../../src/modules/organisations/organisations.service";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";

jest.mock("../../src/lib/prisma", () => ({
	prisma: {
		organisation: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			count: jest.fn(),
		},
		userOrganisation: {
			count: jest.fn(),
		},
	},
}));

const mockedOrganisation = prisma.organisation as {
	findMany: jest.MockedFunction<any>;
	findUnique: jest.MockedFunction<any>;
	create: jest.MockedFunction<any>;
	update: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
};

const mockedUserOrganisation = prisma.userOrganisation as {
	count: jest.MockedFunction<any>;
};

const buildOrganisation = (overrides = {}) => ({
	id: 1,
	name: "xpand Foundation",
	contactEmail: "contact@xpand.net.au",
	governmentId: null,
	countryId: null,
	adminLocationId: null,
	streetAddress: null,
	logoId: null,
	description: null,
	notes: null,
	accountActive: true,
	dateJoined: null,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	...overrides,
});

describe("OrganisationsService - Unit Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("listOrganisations", () => {
		it("should return paginated organisations", async () => {
			mockedOrganisation.findMany.mockResolvedValue([buildOrganisation()]);
			mockedOrganisation.count.mockResolvedValue(1);

			const result = await organisationsService.listOrganisations(1, 10);

			expect(result.data.length).toBe(1);
			expect(result.pagination.total).toBe(1);
			expect(result.pagination.totalPages).toBe(1);
			expect(mockedOrganisation.findMany).toHaveBeenCalled();
		});

		it("should calculate skip correctly for later pages", async () => {
			mockedOrganisation.findMany.mockResolvedValue([]);
			mockedOrganisation.count.mockResolvedValue(25);

			const result = await organisationsService.listOrganisations(3, 10);

			expect(result.pagination.page).toBe(3);
			expect(result.pagination.totalPages).toBe(3);
			expect(mockedOrganisation.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 20, take: 10 }),
			);
		});
	});

	describe("getOrganisationById", () => {
		it("should return organisation when it exists", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());

			const result = await organisationsService.getOrganisationById(1);

			expect(result.id).toBe(1);
			expect(result.name).toBe("xpand Foundation");
		});

		it("should throw 404 when organisation not found", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				organisationsService.getOrganisationById(999),
			).rejects.toThrow(AppError);
		});
	});

	describe("createOrganisation", () => {
		it("should create organisation successfully", async () => {
			mockedOrganisation.create.mockResolvedValue(buildOrganisation());

			const result = await organisationsService.createOrganisation({
				name: "xpand Foundation",
				contact_email: "contact@xpand.net.au",
			});

			expect(result.id).toBe(1);
			expect(result.contact_email).toBe("contact@xpand.net.au");
			expect(mockedOrganisation.create).toHaveBeenCalledTimes(1);
		});

		it("should map optional fields to null when not provided", async () => {
			mockedOrganisation.create.mockResolvedValue(buildOrganisation());

			await organisationsService.createOrganisation({ name: "Only Name" });

			expect(mockedOrganisation.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ governmentId: null }),
				}),
			);
		});
	});

	describe("updateOrganisation", () => {
		it("should update organisation successfully", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedOrganisation.update.mockResolvedValue(
				buildOrganisation({ description: "Updated" }),
			);

			const result = await organisationsService.updateOrganisation(1, {
				description: "Updated",
			});

			expect(result.description).toBe("Updated");
			expect(mockedOrganisation.update).toHaveBeenCalledTimes(1);
		});

		it("should throw 404 when updating a non-existing organisation", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				organisationsService.updateOrganisation(999, { name: "Test" }),
			).rejects.toThrow(AppError);
		});
	});

	describe("deactivateOrganisation", () => {
		it("should deactivate organisation when it has no active users", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisation.count.mockResolvedValue(0);
			mockedOrganisation.update.mockResolvedValue(
				buildOrganisation({ accountActive: false }),
			);

			const result = await organisationsService.deactivateOrganisation(1);

			expect(result.account_active).toBe(false);
			expect(mockedOrganisation.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { accountActive: false },
			});
		});

		it("should throw 409 when organisation has active users", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(buildOrganisation());
			mockedUserOrganisation.count.mockResolvedValue(2);

			await expect(
				organisationsService.deactivateOrganisation(1),
			).rejects.toThrow(AppError);
			expect(mockedOrganisation.update).not.toHaveBeenCalled();
		});

		it("should throw 404 when deactivating a non-existing organisation", async () => {
			mockedOrganisation.findUnique.mockResolvedValue(null);

			await expect(
				organisationsService.deactivateOrganisation(999),
			).rejects.toThrow(AppError);
		});
	});
});
