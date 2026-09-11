const prismaMock = {
	$transaction: jest.fn(),
	treeType: {
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	projectTreeType: {
		count: jest.fn(),
	},
	treeScan: {
		count: jest.fn(),
	},
};

const loggerMock = {
	info: jest.fn(),
	error: jest.fn(),
};

jest.mock("../../src/lib/prisma", () => ({
	prisma: prismaMock,
}));

jest.mock("../../src/config/logger", () => ({
	logger: loggerMock,
}));

import { Decimal } from "@prisma/client/runtime/library";
import { TreeTypesService } from "../../src/modules/tree-types/treeTypes.service";

const makeTreeTypeRecord = (
	overrides: Partial<Record<string, unknown>> = {},
) => ({
	id: 1,
	name: "Eucalyptus",
	key: "eucalyptus",
	scientificName: "Eucalyptus globulus",
	dryWeightDensity: Decimal(650),
	createdAt: new Date("2026-01-28T10:00:00.000Z"),
	updatedAt: new Date("2026-01-28T10:00:00.000Z"),
	...overrides,
});

describe("TreeTypesService", () => {
	let service: TreeTypesService;

	beforeEach(() => {
		service = new TreeTypesService();
		jest.clearAllMocks();
		prismaMock.$transaction.mockImplementation((callback) =>
			callback(prismaMock),
		);
		prismaMock.projectTreeType.count.mockResolvedValue(0);
		prismaMock.treeScan.count.mockResolvedValue(0);
	});

	describe("listTreeTypes", () => {
		it("should return mapped tree types", async () => {
			prismaMock.treeType.findMany.mockResolvedValue([
				makeTreeTypeRecord({ id: 2, name: "Acacia", key: "acacia" }),
			]);

			const result = await service.listTreeTypes();

			expect(prismaMock.treeType.findMany).toHaveBeenCalledWith({
				orderBy: { name: "asc" },
			});
			expect(result).toEqual([
				{
					id: 2,
					name: "Acacia",
					key: "acacia",
					scientific_name: "Eucalyptus globulus",
					dry_weight_density: 650,
					max_diameter_cm: null,
					max_height_m: null,
					min_diameter_cm: null,
					min_height_m: null,
					created_at: "2026-01-28T10:00:00.000Z",
					updated_at: "2026-01-28T10:00:00.000Z",
				},
			]);
		});

		it("should return an empty array when no records exist", async () => {
			prismaMock.treeType.findMany.mockResolvedValue([]);

			const result = await service.listTreeTypes();

			expect(result).toEqual([]);
		});

		it("should return tree types with height and diameter values when present", async () => {
			prismaMock.treeType.findMany.mockResolvedValue([
				makeTreeTypeRecord({
					id: 1,
					name: "Tall Tree",
					dryWeightDensity: Decimal(550),
					minHeightM: Decimal(10.0),
					maxHeightM: Decimal(50.0),
					minDiameterCm: Decimal(20.0),
					maxDiameterCm: Decimal(100.0),
				}),
				makeTreeTypeRecord({
					id: 2,
					name: "Small Tree",
					dryWeightDensity: null,
					minHeightM: null,
					maxHeightM: null,
					minDiameterCm: null,
					maxDiameterCm: null,
				}),
			]);

			const result = await service.listTreeTypes();

			expect(result).toHaveLength(2);
			expect(result[0].dry_weight_density).toBe(550);
			expect(result[0].min_height_m).toBe(10.0);
			expect(result[0].max_height_m).toBe(50.0);
			expect(result[0].min_diameter_cm).toBe(20.0);
			expect(result[0].max_diameter_cm).toBe(100.0);
			expect(result[1].dry_weight_density).toBe(null);
			expect(result[1].min_height_m).toBe(null);
			expect(result[1].max_height_m).toBe(null);
		});
	});

	describe("getTreeTypeById", () => {
		it("should return a mapped tree type when found", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());

			const result = await service.getTreeTypeById(1);

			expect(result).toEqual({
				id: 1,
				name: "Eucalyptus",
				key: "eucalyptus",
				scientific_name: "Eucalyptus globulus",
				dry_weight_density: 650,
				max_diameter_cm: null,
				max_height_m: null,
				min_diameter_cm: null,
				min_height_m: null,
				created_at: "2026-01-28T10:00:00.000Z",
				updated_at: "2026-01-28T10:00:00.000Z",
			});
		});

		it("should throw when the tree type is missing", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(null);

			await expect(service.getTreeTypeById(1)).rejects.toMatchObject({
				statusCode: 404,
				detail: "Tree type not found",
			});
		});
	});

	describe("createTreeType", () => {
		it("should create successfully with full payload", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockResolvedValue(makeTreeTypeRecord());

			const result = await service.createTreeType({
				name: "Eucalyptus",
				key: "eucalyptus",
				scientific_name: "Eucalyptus globulus",
				dry_weight_density: 650,
			});

			expect(prismaMock.treeType.create).toHaveBeenCalledWith({
				data: {
					name: "Eucalyptus",
					key: "eucalyptus",
					scientificName: "Eucalyptus globulus",
					dryWeightDensity: 650,
				},
			});
			expect(result).toEqual(
				expect.objectContaining({
					name: "Eucalyptus",
					key: "eucalyptus",
					dry_weight_density: 650,
				}),
			);
			expect(loggerMock.info).toHaveBeenCalledWith("Tree type created", {
				treeTypeId: 1,
				key: "eucalyptus",
				name: "Eucalyptus",
			});
		});

		it("should create successfully with only the required name", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockResolvedValue(
				makeTreeTypeRecord({
					key: null,
					scientificName: null,
					dryWeightDensity: null,
				}),
			);

			const result = await service.createTreeType({
				name: "Acacia",
			});

			expect(prismaMock.treeType.create).toHaveBeenCalledWith({
				data: {
					name: "Acacia",
					key: undefined,
					scientificName: undefined,
					dryWeightDensity: undefined,
				},
			});

			expect(result.dry_weight_density).toBe(null);
		});

		it("should throw a conflict for a duplicate key", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(makeTreeTypeRecord());

			await expect(
				service.createTreeType({
					name: "Eucalyptus",
					key: "eucalyptus",
				}),
			).rejects.toMatchObject({
				statusCode: 409,
				detail: "Tree type key already exists",
			});
		});

		it("should map a database unique violation to a conflict", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockRejectedValue({ code: "P2002" });

			await expect(
				service.createTreeType({
					name: "Eucalyptus",
					key: "eucalyptus",
				}),
			).rejects.toMatchObject({
				statusCode: 409,
				detail: "Tree type key already exists",
			});
		});

		it("should create successfully with all height and diameter fields", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockResolvedValue(
				makeTreeTypeRecord({
					dryWeightDensity: Decimal(550),
					minHeightM: Decimal(5.5),
					maxHeightM: Decimal(30.0),
					minDiameterCm: Decimal(10.0),
					maxDiameterCm: Decimal(80.0),
				}),
			);

			const result = await service.createTreeType({
				name: "Sugar Gum",
				key: "sugar-gum",
				min_height_m: 5.5,
				max_height_m: 30.0,
				min_diameter_cm: 10.0,
				max_diameter_cm: 80.0,
			});

			expect(prismaMock.treeType.create).toHaveBeenCalledWith({
				data: {
					name: "Sugar Gum",
					key: "sugar-gum",
					minHeightM: 5.5,
					maxHeightM: 30.0,
					minDiameterCm: 10.0,
					maxDiameterCm: 80.0,
				},
			});
			expect(result.min_height_m).toBe(5.5);
			expect(result.max_height_m).toBe(30.0);
			expect(result.min_diameter_cm).toBe(10.0);
			expect(result.max_diameter_cm).toBe(80.0);
		});

		it("should create successfully with only some height/diameter fields", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockResolvedValue(
				makeTreeTypeRecord({
					minHeightM: Decimal(3.0),
					maxHeightM: null,
					minDiameterCm: null,
					maxDiameterCm: null,
				}),
			);

			const result = await service.createTreeType({
				name: "Young Tree",
				min_height_m: 3.0,
			});

			expect(prismaMock.treeType.create).toHaveBeenCalledWith({
				data: {
					name: "Young Tree",
					minHeightM: 3.0,
				},
			});
			expect(result.min_height_m).toBe(3.0);
			expect(result.max_height_m).toBe(null);
		});

		it("should create successfully with both density and height/diameter fields", async () => {
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.create.mockResolvedValue(
				makeTreeTypeRecord({
					dryWeightDensity: Decimal(600),
					minHeightM: Decimal(10.0),
					maxHeightM: Decimal(40.0),
					minDiameterCm: Decimal(15.0),
					maxDiameterCm: Decimal(100.0),
				}),
			);

			const result = await service.createTreeType({
				name: "Tall Eucalyptus",
				dry_weight_density: 600,
				min_height_m: 10.0,
				max_height_m: 40.0,
				min_diameter_cm: 15.0,
				max_diameter_cm: 100.0,
			});

			expect(prismaMock.treeType.create).toHaveBeenCalledWith({
				data: {
					name: "Tall Eucalyptus",
					dryWeightDensity: 600,
					minHeightM: 10.0,
					maxHeightM: 40.0,
					minDiameterCm: 15.0,
					maxDiameterCm: 100.0,
				},
			});
			expect(result.dry_weight_density).toBe(600);
			expect(result.min_height_m).toBe(10.0);
			expect(result.max_height_m).toBe(40.0);
		});
	});

	describe("updateTreeType", () => {
		it("should update only the provided fields", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.update.mockResolvedValue(
				makeTreeTypeRecord({ dryWeightDensity: Decimal(640.5) }),
			);

			const result = await service.updateTreeType(1, {
				dry_weight_density: 640.5,
			});

			expect(prismaMock.treeType.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: undefined,
					key: undefined,
					scientificName: undefined,
					dryWeightDensity: 640.5,
				},
			});
			expect(result.dry_weight_density).toBe(640.5);
		});

		it("should throw when updating a missing record", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(null);

			await expect(
				service.updateTreeType(1, { name: "Updated Eucalyptus" }),
			).rejects.toMatchObject({
				statusCode: 404,
				detail: "Tree type not found",
			});
		});

		it("should map an update race on the unique key to a conflict", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.findFirst.mockResolvedValue(null);
			prismaMock.treeType.update.mockRejectedValue({ code: "P2002" });

			await expect(
				service.updateTreeType(1, { key: "eucalyptus" }),
			).rejects.toMatchObject({
				statusCode: 409,
				detail: "Tree type key already exists",
			});
		});

		it("should update height and diameter fields", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.update.mockResolvedValue(
				makeTreeTypeRecord({
					minHeightM: Decimal(12.0),
					maxHeightM: Decimal(45.0),
					minDiameterCm: Decimal(20.0),
					maxDiameterCm: Decimal(90.0),
				}),
			);

			const result = await service.updateTreeType(1, {
				min_height_m: 12.0,
				max_height_m: 45.0,
				min_diameter_cm: 20.0,
				max_diameter_cm: 90.0,
			});

			expect(prismaMock.treeType.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: undefined,
					key: undefined,
					scientificName: undefined,
					dryWeightDensity: undefined,
					minHeightM: 12.0,
					maxHeightM: 45.0,
					minDiameterCm: 20.0,
					maxDiameterCm: 90.0,
				},
			});
			expect(result.min_height_m).toBe(12.0);
			expect(result.max_height_m).toBe(45.0);
			expect(result.min_diameter_cm).toBe(20.0);
			expect(result.max_diameter_cm).toBe(90.0);
		});

		it("should update only some height/diameter fields", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.update.mockResolvedValue(
				makeTreeTypeRecord({
					minHeightM: Decimal(8.0),
				}),
			);

			const result = await service.updateTreeType(1, {
				min_height_m: 8.0,
			});

			expect(prismaMock.treeType.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: undefined,
					key: undefined,
					scientificName: undefined,
					dryWeightDensity: undefined,
					minHeightM: 8.0,
				},
			});
			expect(result.min_height_m).toBe(8.0);
			expect(result.max_height_m).toBe(null);
		});

		it("should update density alongside height/diameter fields", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.update.mockResolvedValue(
				makeTreeTypeRecord({
					dryWeightDensity: Decimal(700),
					minHeightM: Decimal(15.0),
					maxHeightM: Decimal(50.0),
				}),
			);

			const result = await service.updateTreeType(1, {
				dry_weight_density: 700,
				min_height_m: 15.0,
				max_height_m: 50.0,
			});

			expect(prismaMock.treeType.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: {
					name: undefined,
					key: undefined,
					scientificName: undefined,
					dryWeightDensity: 700,
					minHeightM: 15.0,
					maxHeightM: 50.0,
				},
			});
			expect(result.dry_weight_density).toBe(700);
			expect(result.min_height_m).toBe(15.0);
			expect(result.max_height_m).toBe(50.0);
		});

		it("should return null for height/diameter fields when they are null in the database", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(
				makeTreeTypeRecord({
					dryWeightDensity: null,
					minHeightM: null,
					maxHeightM: null,
					minDiameterCm: null,
					maxDiameterCm: null,
				}),
			);

			const result = await service.getTreeTypeById(1);

			expect(result.dry_weight_density).toBe(null);
			expect(result.min_height_m).toBe(null);
			expect(result.max_height_m).toBe(null);
			expect(result.min_diameter_cm).toBe(null);
			expect(result.max_diameter_cm).toBe(null);
		});
	});

	describe("deleteTreeType", () => {
		it("should delete successfully when there are no references", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.treeType.delete.mockResolvedValue(makeTreeTypeRecord());

			await service.deleteTreeType(1);

			expect(prismaMock.treeType.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
			expect(loggerMock.info).toHaveBeenCalledWith("Tree type deleted", {
				treeTypeId: 1,
				key: "eucalyptus",
				name: "Eucalyptus",
			});
		});

		it("should block delete when referenced by project-tree-types", async () => {
			prismaMock.treeType.findUnique.mockResolvedValue(makeTreeTypeRecord());
			prismaMock.projectTreeType.count.mockResolvedValue(1);
			prismaMock.treeScan.count.mockResolvedValue(0);

			await expect(service.deleteTreeType(1)).rejects.toMatchObject({
				statusCode: 409,
				detail:
					"Tree type cannot be deleted because it is referenced by other records",
			});
			expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
		});

		it("should block delete when referenced by tree-scans", async () => {
			prismaMock.projectTreeType.count.mockResolvedValue(0);
			prismaMock.treeScan.count.mockResolvedValue(1);

			await expect(service.deleteTreeType(1)).rejects.toMatchObject({
				statusCode: 409,
				detail:
					"Tree type cannot be deleted because it is referenced by other records",
			});
			expect(prismaMock.treeType.delete).not.toHaveBeenCalled();
		});

		it("should map a foreign key race during delete to a conflict", async () => {
			prismaMock.$transaction.mockRejectedValue({ code: "P2003" });

			await expect(service.deleteTreeType(1)).rejects.toMatchObject({
				statusCode: 409,
				detail:
					"Tree type cannot be deleted because it is referenced by other records",
			});
		});
	});
});
