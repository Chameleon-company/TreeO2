import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { adoptionsService } from "../../src/modules/adoptions/adoptions.service";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";
import { customError } from "../../src/utils/errorCodes";

jest.mock("../../src/lib/prisma", () => ({
	prisma: {
		adoption: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		adopter: {
			findUnique: jest.fn(),
		},
		project: {
			findUnique: jest.fn(),
		},
	},
}));

const mockedPrismaAdoption = prisma.adoption as {
	create: jest.MockedFunction<any>;
	findMany: jest.MockedFunction<any>;
	findUnique: jest.MockedFunction<any>;
	update: jest.MockedFunction<any>;
	delete: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
};

const mockedPrismaAdopter = prisma.adopter as {
	findUnique: jest.MockedFunction<any>;
};

const mockedPrismaProject = prisma.project as {
	findUnique: jest.MockedFunction<any>;
};

describe("AdoptionsService - Unit Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("createAdoption", () => {
		it("should create adoption successfully", async () => {
			mockedPrismaAdopter.findUnique.mockResolvedValue({
				id: 1,
				name: "Adam",
			});

			mockedPrismaAdoption.create.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const result = await adoptionsService.createAdoption({
				adopter_id: 1,
				fob_id: "NFC-001",
				adopted_at: "2026-05-14",
			});

			expect(result.id).toBe(1);
			expect(result.fobId).toBe("NFC-001");
			expect(mockedPrismaAdopter.findUnique).toHaveBeenCalledTimes(1);
			expect(mockedPrismaAdoption.create).toHaveBeenCalledTimes(1);
		});

		it("should throw 400 when fob_id is empty", async () => {
			await expect(
				adoptionsService.createAdoption({
					adopter_id: 1,
					fob_id: "",
					adopted_at: "2026-05-14",
				}),
			).rejects.toThrow(AppError);
		});

		it("should throw 400 when adopted_at is invalid", async () => {
			await expect(
				adoptionsService.createAdoption({
					adopter_id: 1,
					fob_id: "NFC-001",
					adopted_at: "invalid-date",
				}),
			).rejects.toThrow(AppError);
		});

		it("should throw 400 when adopted_at is in the future", async () => {
			await expect(
				adoptionsService.createAdoption({
					adopter_id: 1,
					fob_id: "NFC-001",
					adopted_at: "2099-01-01",
				}),
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when adopter does not exist", async () => {
			mockedPrismaAdopter.findUnique.mockResolvedValue(null);

			await expect(
				adoptionsService.createAdoption({
					adopter_id: 999,
					fob_id: "NFC-001",
					adopted_at: "2026-05-14",
				}),
			).rejects.toThrow(AppError);
		});

		it("should not check projectId if its not passed", async () => {
			mockedPrismaAdopter.findUnique.mockResolvedValue({
				id: 1,
				name: "Adam",
			});

			mockedPrismaAdoption.create.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const result = await adoptionsService.createAdoption({
				adopter_id: 1,
				fob_id: "NFC-001",
				adopted_at: "2026-05-14",
			});

			expect(result.id).toBe(1);
			expect(result.fobId).toBe("NFC-001");
			expect(mockedPrismaProject.findUnique).not.toHaveBeenCalled();
		});

		it("should create adoption successfully with valid projectId", async () => {
			mockedPrismaProject.findUnique.mockResolvedValue({
				id: 1,
				isActive: true,
			});

			mockedPrismaAdopter.findUnique.mockResolvedValue({
				id: 1,
				name: "Adam",
			});

			mockedPrismaAdoption.create.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const result = await adoptionsService.createAdoption({
				adopter_id: 1,
				fob_id: "NFC-001",
				adopted_at: "2026-05-14",
				project_id: 1,
			});

			expect(result.id).toBe(1);
			expect(result.fobId).toBe("NFC-001");
			expect(mockedPrismaProject.findUnique).toHaveBeenCalledTimes(1);
		});

		it("should throw with a non-existing projectId", async () => {
			mockedPrismaProject.findUnique.mockResolvedValue(null);

			mockedPrismaAdopter.findUnique.mockResolvedValue({
				id: 1,
				name: "Adam",
			});

			mockedPrismaAdoption.create.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const err = customError("DATA_001");
			await expect(
				adoptionsService.createAdoption({
					adopter_id: 1,
					fob_id: "NFC-001",
					adopted_at: "2026-05-14",
					project_id: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Project not found",
			});
		});

		it("should throw for a valid projectId that is inactive", async () => {
			mockedPrismaProject.findUnique.mockResolvedValue({
				id: 1,
				isActive: false,
			});

			mockedPrismaAdopter.findUnique.mockResolvedValue({
				id: 1,
				name: "Adam",
			});

			mockedPrismaAdoption.create.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const err = customError("DATA_005");
			await expect(
				adoptionsService.createAdoption({
					adopter_id: 1,
					fob_id: "NFC-001",
					adopted_at: "2026-05-14",
					project_id: 1,
				}),
			).rejects.toMatchObject({
				statusCode: 422,
				code: err.code,
				message: err.message,
				detail: "Project is archived",
			});
		});
	});

	describe("listAdoptions", () => {
		it("should return paginated adoptions", async () => {
			mockedPrismaAdoption.findMany.mockResolvedValue([
				{
					id: 1,
					adopterId: 1,
					fobId: "NFC-001",
					adoptedAt: new Date("2026-05-14"),
					createdAt: new Date("2026-05-14"),
				},
			]);

			mockedPrismaAdoption.count.mockResolvedValue(1);

			const result = await adoptionsService.listAdoptions({
				page: 1,
				limit: 10,
			});

			expect(result.data.length).toBe(1);
			expect(result.meta.total).toBe(1);
			expect(mockedPrismaAdoption.findMany).toHaveBeenCalled();
		});

		it("should apply fob_id filter", async () => {
			mockedPrismaAdoption.findMany.mockResolvedValue([]);
			mockedPrismaAdoption.count.mockResolvedValue(0);

			await adoptionsService.listAdoptions({
				page: 1,
				limit: 10,
				fob_id: "NFC-001",
			});

			expect(mockedPrismaAdoption.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						fobId: {
							contains: "NFC-001",
							mode: "insensitive",
						},
					}),
				}),
			);
		});

		it("should apply adopter_id filter", async () => {
			mockedPrismaAdoption.findMany.mockResolvedValue([]);
			mockedPrismaAdoption.count.mockResolvedValue(0);

			await adoptionsService.listAdoptions({
				page: 1,
				limit: 10,
				adopter_id: 1,
			});

			expect(mockedPrismaAdoption.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						adopterId: 1,
					}),
				}),
			);
		});

		it("should apply year filter", async () => {
			mockedPrismaAdoption.findMany.mockResolvedValue([]);
			mockedPrismaAdoption.count.mockResolvedValue(0);

			await adoptionsService.listAdoptions({
				page: 1,
				limit: 10,
				year: 2026,
			});

			expect(mockedPrismaAdoption.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						adoptedAt: expect.objectContaining({
							gte: expect.any(Date),
							lte: expect.any(Date),
						}),
					}),
				}),
			);
		});

		it("should throw 400 for invalid pagination", async () => {
			await expect(
				adoptionsService.listAdoptions({
					page: 0,
					limit: 10,
				}),
			).rejects.toThrow(AppError);
		});
	});

	describe("getAdoptionById", () => {
		it("should return adoption when exists", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const result = await adoptionsService.getAdoptionById(1);

			expect(result.id).toBe(1);
		});

		it("should throw 404 when adoption not found", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue(null);

			await expect(adoptionsService.getAdoptionById(999)).rejects.toThrow(
				AppError,
			);
		});

		it("should throw 400 for invalid id", async () => {
			await expect(adoptionsService.getAdoptionById(0)).rejects.toThrow(
				AppError,
			);
		});
	});

	describe("updateAdoption", () => {
		it("should update adoption successfully", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			mockedPrismaAdoption.update.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-UPDATED",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const result = await adoptionsService.updateAdoption(1, {
				fob_id: "NFC-UPDATED",
			});

			expect(result.fobId).toBe("NFC-UPDATED");
			expect(mockedPrismaAdoption.update).toHaveBeenCalledTimes(1);
		});

		it("should throw 400 when no fields provided", async () => {
			await expect(adoptionsService.updateAdoption(1, {})).rejects.toThrow(
				AppError,
			);
		});

		it("should throw 404 when updating non-existing adoption", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue(null);

			await expect(
				adoptionsService.updateAdoption(999, {
					fob_id: "NFC-UPDATED",
				}),
			).rejects.toThrow(AppError);
		});

		it("should throw 404 when updated adopter does not exist", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			mockedPrismaAdopter.findUnique.mockResolvedValue(null);

			await expect(
				adoptionsService.updateAdoption(1, {
					adopter_id: 999,
				}),
			).rejects.toThrow(AppError);
		});

		it("should update a valid projectId successfully", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			mockedPrismaProject.findUnique.mockResolvedValue({ isActive: true });

			mockedPrismaAdoption.update.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
				projectId: 1,
			});

			const result = await adoptionsService.updateAdoption(1, {
				project_id: 1,
			});

			expect(result.projectId).toBe(1);
			expect(mockedPrismaAdoption.update).toHaveBeenCalledTimes(1);
			expect(mockedPrismaProject.findUnique).toHaveBeenCalledTimes(1);
		});

		it("should throw for a non-existing project", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const err = customError("DATA_001");
			mockedPrismaProject.findUnique.mockResolvedValue(null);

			await expect(
				adoptionsService.updateAdoption(1, {
					project_id: 999,
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Project not found",
			});
		});

		it("should throw for an inactive project", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				adopterId: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
			});

			const err = customError("DATA_005");
			mockedPrismaProject.findUnique.mockResolvedValue({ isActive: false });

			await expect(
				adoptionsService.updateAdoption(1, {
					project_id: 999,
				}),
			).rejects.toMatchObject({
				statusCode: 422,
				code: err.code,
				message: err.message,
				detail: "Project is archived",
			});
		});

		it("should throw if adoption is cancelled", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
				fobId: "NFC-001",
				adoptedAt: new Date("2026-05-14"),
				createdAt: new Date("2026-05-14"),
				cancelledAt: new Date("2026-05-14"),
			});

			const err = customError("DATA_005");
			await expect(
				adoptionsService.updateAdoption(1, {
					fob_id: "FOB-UPDATED",
				}),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Adoption is cancelled",
			});
		});
	});

	describe("deleteAdoption", () => {
		it("should delete adoption successfully", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue({
				id: 1,
			});

			mockedPrismaAdoption.delete.mockResolvedValue({
				id: 1,
			});

			const result = await adoptionsService.deleteAdoption(1, {
				cancellationReason: undefined,
			});

			expect(result.message).toBe("Adoption deleted successfully");
			expect(mockedPrismaAdoption.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					cancelledAt: expect.any(Date),
					cancellationReason: null,
				},
			});
		});

		it("should throw 404 when deleting non-existing adoption", async () => {
			mockedPrismaAdoption.findUnique.mockResolvedValue(null);

			await expect(
				adoptionsService.deleteAdoption(999, { cancellationReason: undefined }),
			).rejects.toThrow(AppError);
		});
	});
});
