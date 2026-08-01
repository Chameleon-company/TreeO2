import {
	createScanBatch,
	deleteScanBatch,
	getScanBatchById,
	getScanBatches,
} from "../../src/modules/scan-batches/scanBatches.service";

import {
	SCAN_BATCHES_AUTH_ROLES,
	SCAN_BATCHES_DB_ROLES,
	SCAN_BATCHES_MESSAGES,
} from "../../src/modules/scan-batches/scan-batches.constants";
import { customError } from "../../src/utils/errorCodes";

jest.mock("../../src/lib/prisma", () => {
	const mockPrisma: any = {
		scanBatch: {
			findMany: jest.fn(),
			count: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		treeScan: {
			findMany: jest.fn(),
			createMany: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		project: {
			findUnique: jest.fn(),
		},
		userProject: {
			findFirst: jest.fn(),
		},
		treeType: {
			findUnique: jest.fn(),
		},
		projectTreeType: {
			findFirst: jest.fn(),
		},
	};

	mockPrisma.$transaction = jest.fn((callback: any) => callback(mockPrisma));

	return {
		prisma: mockPrisma,
	};
});

const { prisma: mockPrisma } = jest.requireMock("../../src/lib/prisma");

describe("ScanBatchesService", () => {
	const adminUser = {
		id: 1,
		role: SCAN_BATCHES_AUTH_ROLES.ADMIN,
	};

	const managerUser = {
		id: 3,
		role: SCAN_BATCHES_AUTH_ROLES.MANAGER,
	};

	const inspectorUser = {
		id: 4,
		role: SCAN_BATCHES_AUTH_ROLES.INSPECTOR,
	};

	const validCreateInput = {
		inspector_id: inspectorUser.id,
		project_id: 1,
		device_id: "MOB-001",
		uploaded_at: new Date("2024-05-20T10:35:00.000Z"),
		scans: [
			{
				fob_id: "SWAGGER-001",
				farmer_id: 16,
				species_id: 1,
				estimated_planted_year: 2024,
				estimated_planted_month: 5,
				planted_date: new Date("2024-05-20"),
				height_m: 2.5,
				circumference_cm: 45.3,
				diameter_cm: 14.4,
				latitude: -8.5569,
				longitude: 125.5603,
				photo_id: "550e8400-e29b-41d4-a716-446655440000",
				client_scan_id: "7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c",
				scan_timestamp: new Date("2024-05-20T10:30:00.000Z"),
			},
		],
	};

	const inspectorRecord = {
		id: inspectorUser.id,
		accountActive: true,
		canSignIn: true,
		primaryRole: {
			id: 3,
			name: SCAN_BATCHES_DB_ROLES.INSPECTOR,
		},
	};

	const farmerRecord = {
		id: 16,
		accountActive: true,
		canSignIn: true,
		primaryRole: {
			id: 4,
			name: SCAN_BATCHES_DB_ROLES.FARMER,
		},
	};

	const scanBatchRecord = {
		id: 1,
		inspectorId: inspectorUser.id,
		projectId: 1,
		uploadedAt: new Date("2024-05-20T10:35:00.000Z"),
		inspector: {
			id: inspectorUser.id,
			name: "Dev Inspector",
			email: "dev-inspector@treeo2.local",
		},
		project: {
			id: 1,
			name: "Hera Reforestation 2025",
		},
		treeScans: [
			{
				id: 1,
				fobId: "SWAGGER-001",
				projectId: 1,
				farmerId: 16,
				inspectorId: inspectorUser.id,
				speciesId: 1,
				estimatedPlantedYear: 2024,
				estimatedPlantedMonth: 5,
				batchId: 1,
			},
		],
	};

	const mockSuccessfulCreateDependencies = () => {
		mockPrisma.user.findUnique
			.mockResolvedValueOnce(inspectorRecord)
			.mockResolvedValueOnce(farmerRecord);

		mockPrisma.project.findUnique.mockResolvedValue({
			id: 1,
			isActive: true,
		});

		mockPrisma.userProject.findFirst.mockResolvedValue({
			userId: inspectorUser.id,
			projectId: 1,
		});

		mockPrisma.treeType.findUnique.mockResolvedValue({
			id: 1,
			name: "Mahogany",
		});

		mockPrisma.projectTreeType.findFirst.mockResolvedValue({
			projectId: 1,
			treeTypeId: 1,
		});

		mockPrisma.treeScan.findMany.mockResolvedValue([]);

		mockPrisma.scanBatch.create.mockResolvedValue({
			id: 1,
			inspectorId: inspectorUser.id,
			projectId: 1,
			uploadedAt: validCreateInput.uploaded_at,
		});

		mockPrisma.treeScan.createMany.mockResolvedValue({
			count: 1,
		});

		mockPrisma.scanBatch.findUnique.mockResolvedValue(scanBatchRecord);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getScanBatches", () => {
		// Tests admin retrieval of paginated scan batches
		it("should return paginated scan batches for admin", async () => {
			mockPrisma.scanBatch.findMany.mockResolvedValue([scanBatchRecord]);
			mockPrisma.scanBatch.count.mockResolvedValue(1);

			const result = await getScanBatches(
				{
					page: 1,
					limit: 20,
					project_id: 1,
					inspector_id: 4,
				},
				adminUser,
			);

			expect(mockPrisma.scanBatch.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						projectId: 1,
						inspectorId: 4,
					},
					skip: 0,
					take: 20,
					orderBy: {
						uploadedAt: "desc",
					},
				}),
			);

			expect(result).toEqual({
				data: [scanBatchRecord],
				pagination: {
					page: 1,
					limit: 20,
					total: 1,
					totalPages: 1,
				},
			});
		});

		// Tests inspector-only filtering for scan batch listing
		it("should scope inspector results to own batches", async () => {
			mockPrisma.scanBatch.findMany.mockResolvedValue([scanBatchRecord]);
			mockPrisma.scanBatch.count.mockResolvedValue(1);

			await getScanBatches(
				{
					page: 1,
					limit: 20,
				},
				inspectorUser,
			);

			expect(mockPrisma.scanBatch.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						inspectorId: inspectorUser.id,
					},
				}),
			);
		});

		// Tests manager filtering by assigned project batches
		it("should scope manager results to assigned projects", async () => {
			mockPrisma.scanBatch.findMany.mockResolvedValue([scanBatchRecord]);
			mockPrisma.scanBatch.count.mockResolvedValue(1);

			await getScanBatches(
				{
					page: 1,
					limit: 20,
				},
				managerUser,
			);

			expect(mockPrisma.scanBatch.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						project: {
							userProjects: {
								some: {
									userId: managerUser.id,
								},
							},
						},
					},
				}),
			);
		});

		// Tests pagination calculation for scan batch listing
		it("should calculate pagination correctly", async () => {
			mockPrisma.scanBatch.findMany.mockResolvedValue([scanBatchRecord]);
			mockPrisma.scanBatch.count.mockResolvedValue(45);

			const result = await getScanBatches(
				{
					page: 2,
					limit: 20,
				},
				adminUser,
			);

			expect(mockPrisma.scanBatch.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					skip: 20,
					take: 20,
				}),
			);

			expect(result.pagination).toEqual({
				page: 2,
				limit: 20,
				total: 45,
				totalPages: 3,
			});
		});
	});

	describe("getScanBatchById", () => {
		// Tests admin retrieval of a single scan batch
		it("should return scan batch when admin requests valid batch", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(scanBatchRecord);

			const result = await getScanBatchById(1, adminUser);

			expect(mockPrisma.scanBatch.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
				}),
			);

			expect(result).toEqual(scanBatchRecord);
		});

		// Tests inspector access to their own scan batch
		it("should allow inspector to access own scan batch", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(scanBatchRecord);

			const result = await getScanBatchById(1, inspectorUser);

			expect(result).toEqual(scanBatchRecord);
		});

		// Tests inspector forbidden access to another inspector batch
		it("should throw forbidden when inspector accesses another inspector batch", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue({
				...scanBatchRecord,
				inspectorId: 999,
			});

			const err = customError("AUTH_004");
			await expect(getScanBatchById(1, inspectorUser)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
				code: err.code,
				message: err.message,
			});
		});

		// Tests manager access to a batch from assigned project
		it("should allow manager to access assigned project batch", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(scanBatchRecord);
			mockPrisma.userProject.findFirst.mockResolvedValue({
				userId: managerUser.id,
				projectId: scanBatchRecord.projectId,
			});

			const result = await getScanBatchById(1, managerUser);

			expect(mockPrisma.userProject.findFirst).toHaveBeenCalledWith({
				where: {
					userId: managerUser.id,
					projectId: scanBatchRecord.projectId,
				},
			});

			expect(result).toEqual(scanBatchRecord);
		});

		// Tests manager forbidden access to an unassigned project batch
		it("should throw forbidden when manager accesses unassigned project batch", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(scanBatchRecord);
			mockPrisma.userProject.findFirst.mockResolvedValue(null);

			const err = customError("AUTH_004");
			await expect(getScanBatchById(1, managerUser)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
				code: err.code,
				message: err.message,
			});
		});

		// Tests not-found behavior for missing scan batch
		it("should throw not found when scan batch does not exist", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(getScanBatchById(999, adminUser)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});
	});

	describe("createScanBatch", () => {
		beforeEach(() => {
			mockSuccessfulCreateDependencies();
		});

		// Tests successful creation of scan batch and child tree scans
		it("should create a scan batch successfully with valid input", async () => {
			const result = await createScanBatch(validCreateInput);

			expect(mockPrisma.scanBatch.create).toHaveBeenCalledWith({
				data: {
					inspectorId: inspectorUser.id,
					projectId: 1,
					deviceId: "MOB-001",
					uploadedAt: validCreateInput.uploaded_at,
				},
			});

			expect(mockPrisma.treeScan.createMany).toHaveBeenCalledWith({
				data: [
					expect.objectContaining({
						fobId: "SWAGGER-001",
						projectId: 1,
						farmerId: 16,
						inspectorId: inspectorUser.id,
						speciesId: 1,
						estimatedPlantedYear: 2024,
						estimatedPlantedMonth: 5,
						deviceId: "MOB-001",
						clientScanId: "7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c",
						batchId: 1,
					}),
				],
				skipDuplicates: true,
			});

			expect(result).toEqual({
				batch: scanBatchRecord,
				summary: {
					created: 1,
					skipped: 0,
					skippedClientScanIds: [],
				},
			});
		});

		// Tests idempotent no-op when every submitted scan already exists
		it("should skip batch creation when all scans already exist", async () => {
			mockPrisma.treeScan.findMany.mockResolvedValue([
				{ clientScanId: "7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c" },
			]);

			const result = await createScanBatch(validCreateInput);

			expect(mockPrisma.scanBatch.create).not.toHaveBeenCalled();
			expect(mockPrisma.treeScan.createMany).not.toHaveBeenCalled();

			expect(result).toEqual({
				batch: null,
				summary: {
					created: 0,
					skipped: 1,
					skippedClientScanIds: ["7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c"],
				},
			});
		});

		// Tests that only new scans are inserted when a batch mixes new and duplicate scans
		it("should insert only new scans when some already exist", async () => {
			const secondScan = {
				...validCreateInput.scans[0],
				fob_id: "SWAGGER-002",
				client_scan_id: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
			};

			const mixedInput = {
				...validCreateInput,
				scans: [validCreateInput.scans[0], secondScan],
			};

			// Validation loop runs once per scan, so mock inspector + two farmers.
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique
				.mockResolvedValueOnce(inspectorRecord)
				.mockResolvedValueOnce(farmerRecord)
				.mockResolvedValueOnce(farmerRecord);

			// Only the first scan already exists; the second is new.
			mockPrisma.treeScan.findMany.mockResolvedValue([
				{ clientScanId: "7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c" },
			]);
			mockPrisma.treeScan.createMany.mockResolvedValue({ count: 1 });

			const result = await createScanBatch(mixedInput);

			expect(mockPrisma.treeScan.createMany).toHaveBeenCalledWith({
				data: [
					expect.objectContaining({
						fobId: "SWAGGER-002",
						clientScanId: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
					}),
				],
				skipDuplicates: true,
			});

			expect(result.summary).toEqual({
				created: 1,
				skipped: 1,
				skippedClientScanIds: ["7b9c1e42-2b1e-4f0a-9c3a-1d2e3f4a5b6c"],
			});
		});

		// Tests default upload timestamp when uploaded_at is omitted
		it("should use current date when uploaded_at is not provided", async () => {
			const inputWithoutUploadedAt = {
				...validCreateInput,
				uploaded_at: null,
			};

			await createScanBatch(inputWithoutUploadedAt);

			expect(mockPrisma.scanBatch.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					uploadedAt: expect.any(Date),
				}),
			});
		});

		// Tests missing inspector validation
		it("should throw not found when inspector does not exist", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique.mockResolvedValueOnce(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});

		// Tests inspector role validation
		it("should throw invalid role when user is not inspector", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique.mockResolvedValueOnce({
				...inspectorRecord,
				primaryRole: {
					id: 2,
					name: SCAN_BATCHES_DB_ROLES.MANAGER,
				},
			});

			const err = customError("AUTH_004");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.INVALID_INSPECTOR_ROLE,
				code: err.code,
				message: err.message,
			});
		});

		// Tests inactive inspector account validation
		it("should throw forbidden when inspector account is inactive", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique.mockResolvedValueOnce({
				...inspectorRecord,
				accountActive: false,
			});

			const err = customError("AUTH_003");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: "Inspector account is inactive or cannot sign in",
				code: err.code,
				message: err.message,
			});
		});

		// Tests inspector canSignIn validation
		it("should throw forbidden when inspector cannot sign in", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique.mockResolvedValueOnce({
				...inspectorRecord,
				canSignIn: false,
			});

			const err = customError("AUTH_003");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: "Inspector account is inactive or cannot sign in",
				code: err.code,
				message: err.message,
			});
		});

		// Tests missing project validation
		it("should throw not found when project does not exist", async () => {
			mockPrisma.project.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.PROJECT_NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});

		// Tests inspector project assignment validation
		it("should throw forbidden when inspector is not assigned to project", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique
				.mockResolvedValueOnce(inspectorRecord)
				.mockResolvedValueOnce(farmerRecord);

			mockPrisma.userProject.findFirst.mockReset();
			mockPrisma.userProject.findFirst.mockResolvedValueOnce(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_ASSIGNED,
				code: err.code,
				message: err.message,
			});
		});

		// Tests missing farmer validation
		it("should throw not found when farmer does not exist", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique
				.mockResolvedValueOnce(inspectorRecord)
				.mockResolvedValueOnce(null);

			mockPrisma.userProject.findFirst.mockReset();
			mockPrisma.userProject.findFirst.mockResolvedValueOnce({
				userId: inspectorUser.id,
				projectId: 1,
			});

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});

		// Tests farmer role validation
		it("should throw invalid role when farmer_id does not belong to Farmer role", async () => {
			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique
				.mockResolvedValueOnce(inspectorRecord)
				.mockResolvedValueOnce({
					...farmerRecord,
					primaryRole: {
						id: 2,
						name: SCAN_BATCHES_DB_ROLES.MANAGER,
					},
				});

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.INVALID_FARMER_ROLE,
				code: err.code,
				message: err.message,
			});
		});

		// Tests farmer project assignment validation
		it("should throw forbidden when farmer is not assigned to project", async () => {
			mockPrisma.userProject.findFirst
				.mockResolvedValueOnce({
					userId: inspectorUser.id,
					projectId: 1,
				})
				.mockResolvedValueOnce(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.FARMER_NOT_ASSIGNED,
				code: err.code,
				message: err.message,
			});
		});

		// Tests missing species validation
		it("should throw not found when species does not exist", async () => {
			mockPrisma.treeType.findUnique.mockResolvedValue(null);
			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.SPECIES_NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});

		// Tests species-project assignment validation
		it("should throw forbidden when species is not assigned to project", async () => {
			mockPrisma.projectTreeType.findFirst.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(validCreateInput)).rejects.toMatchObject({
				statusCode: 403,
				detail: SCAN_BATCHES_MESSAGES.SPECIES_NOT_IN_PROJECT,
				code: err.code,
				message: err.message,
			});
		});

		// Tests height measurement upper-limit validation
		it("should throw invalid measurement when height exceeds limit", async () => {
			const err = customError("VAL_006");
			await expect(
				createScanBatch({
					...validCreateInput,
					scans: [
						{
							...validCreateInput.scans[0],
							height_m: 101,
						},
					],
				}),
			).rejects.toMatchObject({
				statusCode: 422,
				detail: SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
				code: err.code,
				message: err.message,
			});
		});

		// Tests diameter measurement upper-limit validation
		it("should throw invalid measurement when diameter exceeds limit", async () => {
			const err = customError("VAL_006");
			await expect(
				createScanBatch({
					...validCreateInput,
					scans: [
						{
							...validCreateInput.scans[0],
							diameter_cm: 1001,
						},
					],
				}),
			).rejects.toMatchObject({
				statusCode: 422,
				detail: SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
				code: err.code,
				message: err.message,
			});
		});

		// Tests circumference measurement upper-limit validation
		it("should throw invalid measurement when circumference exceeds limit", async () => {
			const err = customError("VAL_006");
			await expect(
				createScanBatch({
					...validCreateInput,
					scans: [
						{
							...validCreateInput.scans[0],
							circumference_cm: 4001,
						},
					],
				}),
			).rejects.toMatchObject({
				statusCode: 422,
				detail: SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
				code: err.code,
				message: err.message,
			});
		});

		// Tests that each scan in a multi-scan batch is validated
		it("should validate every scan in a multi-scan batch", async () => {
			const multiScanInput = {
				...validCreateInput,
				scans: [
					validCreateInput.scans[0],
					{
						...validCreateInput.scans[0],
						fob_id: "SWAGGER-002",
						farmer_id: 999,
					},
				],
			};

			mockPrisma.user.findUnique.mockReset();
			mockPrisma.user.findUnique
				.mockResolvedValueOnce(inspectorRecord)
				.mockResolvedValueOnce(farmerRecord)
				.mockResolvedValueOnce(null);

			const err = customError("DATA_001");
			await expect(createScanBatch(multiScanInput)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});
	});

	describe("deleteScanBatch", () => {
		// Tests successful deletion of an empty scan batch
		it("should delete scan batch when it exists and has no related scans", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue({
				id: 1,
				_count: {
					treeScans: 0,
				},
			});

			mockPrisma.scanBatch.delete.mockResolvedValue({
				id: 1,
			});

			const result = await deleteScanBatch(1);

			expect(mockPrisma.scanBatch.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});

			expect(result).toEqual({
				success: true,
				message: SCAN_BATCHES_MESSAGES.DELETED,
			});
		});

		// Tests not-found behavior when deleting missing scan batch
		it("should throw not found when scan batch does not exist", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(deleteScanBatch(999)).rejects.toMatchObject({
				statusCode: 404,
				detail: SCAN_BATCHES_MESSAGES.NOT_FOUND,
				code: err.code,
				message: err.message,
			});
		});

		// Tests deletion protection when scan batch has related tree scans
		it("should block delete when scan batch has related tree scans", async () => {
			mockPrisma.scanBatch.findUnique.mockResolvedValue({
				id: 1,
				_count: {
					treeScans: 1,
				},
			});

			const err = customError("DATA_004");

			await expect(deleteScanBatch(1)).rejects.toMatchObject({
				statusCode: 409,
				detail: SCAN_BATCHES_MESSAGES.DELETE_BLOCKED_HAS_SCANS,
				code: err.code,
				message: err.message,
			});

			expect(mockPrisma.scanBatch.delete).not.toHaveBeenCalled();
		});
	});
});
