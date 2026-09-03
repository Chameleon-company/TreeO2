import { Prisma, TreeScan } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
	CreateScanBatchInput,
	GetScanBatchesQueryInput,
} from "./scan-batches.schema";
import {
	SCAN_BATCHES_AUDIT,
	SCAN_BATCHES_AUTH_ROLES,
	SCAN_BATCHES_DB_ROLES,
	SCAN_BATCHES_DEFAULTS,
	SCAN_BATCHES_MAX_TRANSACTION_RETRIES,
	SCAN_BATCHES_MESSAGES,
} from "./scan-batches.constants";
import { TREE_SCAN_AUDIT_CHANGE_TYPES } from "../tree-scans/treeScans.constants";
import { customError } from "../../utils/errorCodes";

interface CurrentUser {
	id: number;
	role: string;
}

type CreateScanBatchServiceInput = CreateScanBatchInput & {
	inspector_id: number;
};

// A single scan from the validated upload payload.
type ScanInput = CreateScanBatchServiceInput["scans"][number];

// A duplicate whose stored record is being overwritten under last-write-wins,
// paired with the full stored row so its previous state can be audited.
interface ScanOverwrite {
	scan: ScanInput;
	existing: TreeScan;
}

type ScanBatchWithRelations = Prisma.ScanBatchGetPayload<{
	include: {
		inspector: { select: { id: true; name: true; email: true } };
		project: { select: { id: true; name: true } };
		treeScans: true;
	};
}>;

// Result of an upload. `batch` is null when no scan was created or overwritten,
// in which case no batch header is created.
interface CreateScanBatchResult {
	batch: ScanBatchWithRelations | null;
	summary: {
		created_count: number;
		updated_count: number;
		skipped: number;
		skippedClientScanIds: string[];
		skippedNoTimestamp: string[];
	};
}

// Field mapping shared by inserts and last-write-wins overwrites
const toTreeScanFields = (
	scan: ScanInput,
	data: CreateScanBatchServiceInput,
) => ({
	fobId: scan.fob_id,
	projectId: data.project_id,
	farmerId: scan.farmer_id,
	inspectorId: data.inspector_id,
	speciesId: scan.species_id,
	estimatedPlantedYear: scan.estimated_planted_year,
	estimatedPlantedMonth: scan.estimated_planted_month,
	plantedDate: scan.planted_date ?? null,
	heightM: scan.height_m ?? null,
	diameterCm: scan.diameter_cm ?? null,
	circumferenceCm: scan.circumference_cm ?? null,
	latitude: scan.latitude ?? null,
	longitude: scan.longitude ?? null,
	photoId: scan.photo_id ?? null,
	deviceId: data.device_id,
	clientScanId: scan.client_scan_id,
	scanTimestamp: scan.scan_timestamp ?? null,
});

const toJson = (value: unknown): Prisma.InputJsonValue =>
	JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

// A Serializable transaction aborts with P2034 on write conflict. Prisma's
// guidance is to retry rather than surface the conflict to the client.
const runWithWriteConflictRetry = async <T>(
	run: () => Promise<T>,
): Promise<T> => {
	let lastError: unknown;

	for (
		let attempt = 0;
		attempt < SCAN_BATCHES_MAX_TRANSACTION_RETRIES;
		attempt++
	) {
		try {
			return await run();
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2034"
			) {
				lastError = error;
				continue;
			}

			throw error;
		}
	}

	// Retries exhausted: errorHandler maps P2034 to a 409 telling the client to
	// retry the request.
	throw lastError;
};

// Confirm the uploading inspector exists, holds the Inspector role, and has an
// active, sign-in-capable account.
const validateInspector = async (inspectorId: number): Promise<void> => {
	const inspector = await prisma.user.findUnique({
		where: { id: inspectorId },
		include: { primaryRole: true },
	});

	if (!inspector) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_FOUND,
		);
	}

	if (inspector.primaryRole?.name !== SCAN_BATCHES_DB_ROLES.INSPECTOR) {
		throw new AppError(
			403,
			customError("AUTH_004"),
			SCAN_BATCHES_MESSAGES.INVALID_INSPECTOR_ROLE,
		);
	}

	if (!inspector.accountActive || !inspector.canSignIn) {
		throw new AppError(
			403,
			customError("AUTH_003"),
			"Inspector account is inactive or cannot sign in",
		);
	}
};

// Confirm the target project exists and is accepting uploads.
const validateProject = async (projectId: number): Promise<void> => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
	});

	if (!project) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.PROJECT_NOT_FOUND,
		);
	}

	if (!project.isActive) {
		throw new AppError(
			422,
			customError("DATA_005"),
			SCAN_BATCHES_MESSAGES.PROJECT_INACTIVE,
		);
	}
};

// Confirm the inspector is assigned to the project they are uploading to.
const validateInspectorAssignment = async (
	inspectorId: number,
	projectId: number,
): Promise<void> => {
	const inspectorAssignment = await prisma.userProject.findFirst({
		where: { userId: inspectorId, projectId },
	});

	if (!inspectorAssignment) {
		throw new AppError(
			403,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_ASSIGNED,
		);
	}
};

// Confirm a scan's farmer exists, holds the Farmer role, and is assigned to the
// project.
const validateFarmer = async (
	farmerId: number,
	projectId: number,
): Promise<void> => {
	const farmer = await prisma.user.findUnique({
		where: { id: farmerId },
		include: { primaryRole: true },
	});

	if (!farmer) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
		);
	}

	if (farmer.primaryRole?.name !== SCAN_BATCHES_DB_ROLES.FARMER) {
		throw new AppError(
			403,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.INVALID_FARMER_ROLE,
		);
	}

	const farmerAssignment = await prisma.userProject.findFirst({
		where: { userId: farmerId, projectId },
	});

	if (!farmerAssignment) {
		throw new AppError(
			403,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.FARMER_NOT_ASSIGNED,
		);
	}
};

// Confirm a scan's species exists and is assigned to the project.
const validateSpecies = async (
	speciesId: number,
	projectId: number,
): Promise<void> => {
	const species = await prisma.treeType.findUnique({
		where: { id: speciesId },
	});

	if (!species) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.SPECIES_NOT_FOUND,
		);
	}

	const projectSpecies = await prisma.projectTreeType.findFirst({
		where: { projectId, treeTypeId: speciesId },
	});

	if (!projectSpecies) {
		throw new AppError(
			403,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.SPECIES_NOT_IN_PROJECT,
		);
	}
};

// Fetch paginated scan batches with role-based access filtering
export const getScanBatches = async (
	query: GetScanBatchesQueryInput,
	currentUser: CurrentUser,
) => {
	const page = query.page || SCAN_BATCHES_DEFAULTS.PAGE;
	const limit = query.limit || SCAN_BATCHES_DEFAULTS.LIMIT;
	const skip = (page - 1) * limit;

	const where: Prisma.ScanBatchWhereInput = {};

	if (query.project_id) {
		where.projectId = query.project_id;
	}

	if (query.inspector_id) {
		where.inspectorId = query.inspector_id;
	}

	if (currentUser.role === SCAN_BATCHES_AUTH_ROLES.INSPECTOR) {
		where.inspectorId = currentUser.id;
	}

	if (currentUser.role === SCAN_BATCHES_AUTH_ROLES.MANAGER) {
		where.project = {
			userProjects: {
				some: {
					userId: currentUser.id,
				},
			},
		};
	}

	const [scanBatches, total] = await Promise.all([
		prisma.scanBatch.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				uploadedAt: "desc",
			},
			include: {
				inspector: {
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
				_count: {
					select: {
						treeScans: true,
					},
				},
			},
		}),
		prisma.scanBatch.count({ where }),
	]);

	return {
		data: scanBatches,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// Retrieve a single scan batch with role-based access validation
export const getScanBatchById = async (
	id: number,
	currentUser: CurrentUser,
) => {
	const scanBatch = await prisma.scanBatch.findUnique({
		where: { id },
		include: {
			inspector: {
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
			treeScans: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!scanBatch) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.NOT_FOUND,
		);
	}

	if (
		currentUser.role === SCAN_BATCHES_AUTH_ROLES.INSPECTOR &&
		scanBatch.inspectorId !== currentUser.id
	) {
		throw new AppError(
			403,
			customError("AUTH_004"),
			SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
		);
	}

	if (currentUser.role === SCAN_BATCHES_AUTH_ROLES.MANAGER) {
		const hasAccess = await prisma.userProject.findFirst({
			where: {
				userId: currentUser.id,
				projectId: scanBatch.projectId,
			},
		});

		if (!hasAccess) {
			throw new AppError(
				403,
				customError("AUTH_004"),
				SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
			);
		}
	}

	return scanBatch;
};

// Validate and create a scan batch with related tree scans
export const createScanBatch = async (
	data: CreateScanBatchServiceInput,
): Promise<CreateScanBatchResult> => {
	// Batch-level checks: uploading inspector, target project, and their link.
	await validateInspector(data.inspector_id);
	await validateProject(data.project_id);
	await validateInspectorAssignment(data.inspector_id, data.project_id);

	// Per-scan reference checks. Measurement bounds are enforced by the Zod
	// schema (createScanBatchSchema) at parse time, so they are not repeated here.
	for (const scan of data.scans) {
		await validateFarmer(scan.farmer_id, data.project_id);
		await validateSpecies(scan.species_id, data.project_id);
	}

	const clientScanIds = data.scans.map((scan) => scan.client_scan_id);

	// Server-defined upload time (V1.3 10.6). One instant for the whole upload:
	// the batch header and every scan it writes (inserted or overwritten) share
	// the exact same timestamp.
	const uploadedAt = new Date();

	const upload = await runWithWriteConflictRetry(() =>
		prisma.$transaction(
			async (tx) => {
				// Full rows, so an overwrite can record the previous state on
				// tree_scan_audit without a second read per scan.
				const existingScans = await tx.treeScan.findMany({
					where: {
						projectId: data.project_id,
						inspectorId: data.inspector_id,
						deviceId: data.device_id,
						clientScanId: { in: clientScanIds },
					},
				});

				const existingByClientScanId = new Map(
					existingScans.map((scan) => [scan.clientScanId, scan]),
				);

				const newScans: ScanInput[] = [];
				const overwrites: ScanOverwrite[] = [];
				const skippedClientScanIds: string[] = [];
				const skippedNoTimestamp: string[] = [];

				for (const scan of data.scans) {
					const existing = existingByClientScanId.get(scan.client_scan_id);

					if (!existing) {
						newScans.push(scan);
						continue;
					}

					// Last-write-wins is decided on scan_timestamp (V1.3 10.7/7.24), but
					// the column is nullable (V1.2 7.20). Without one there is nothing to
					// compare, so V1.2 10.5 idempotency applies and no second record is
					// created.
					if (!scan.scan_timestamp) {
						skippedNoTimestamp.push(scan.client_scan_id);
						continue;
					}

					// A stored row is only "modified" once it has been written again after
					// insert; until then updatedAt just records when it was posted.
					const serverModified =
						existing.updatedAt.getTime() > existing.createdAt.getTime();

					// V1.3 10.7/7.24. Unmodified server record: the offline scan is the
					// authoritative field observation and replaces it, provided it is a
					// later observation than the stored one. Modified server record: the
					// most recent authoritative modification wins, so the scan must have
					// been captured after that modification.
					const overwrite = serverModified
						? scan.scan_timestamp > existing.updatedAt
						: existing.scanTimestamp === null ||
							scan.scan_timestamp > existing.scanTimestamp;

					if (overwrite) {
						overwrites.push({ scan, existing });
					} else {
						skippedClientScanIds.push(scan.client_scan_id);
					}
				}

				// Nothing to write: report the upload as an idempotent no-op rather
				// than creating an empty batch header. Detecting a duplicate *batch*
				// header needs a client_batch_id, which is parked pending
				// product-owner sign-off (V1.2 10.5/10.6).
				if (newScans.length === 0 && overwrites.length === 0) {
					return {
						batchId: null,
						created_count: 0,
						updated_count: 0,
						skippedClientScanIds,
						skippedNoTimestamp,
					};
				}

				const scanBatch = await tx.scanBatch.create({
					data: {
						inspectorId: data.inspector_id,
						projectId: data.project_id,
						deviceId: data.device_id,
						uploadedAt,
					},
				});

				const inserted =
					newScans.length > 0
						? await tx.treeScan.createMany({
								data: newScans.map((scan) => ({
									...toTreeScanFields(scan, data),
									batchId: scanBatch.id,
									uploadTimestamp: uploadedAt,
								})),
							})
						: { count: 0 };

				for (const { scan, existing } of overwrites) {
					const updated = await tx.treeScan.update({
						where: { id: existing.id },
						data: {
							...toTreeScanFields(scan, data),
							batchId: scanBatch.id,
							uploadTimestamp: uploadedAt,
						},
					});

					await tx.treeScanAudit.create({
						data: {
							treeScanId: existing.id,
							changedBy: data.inspector_id,
							changeType: TREE_SCAN_AUDIT_CHANGE_TYPES.CORRECTED,
							changeReason: SCAN_BATCHES_AUDIT.LAST_WRITE_WINS_REASON,
							oldData: toJson(existing),
							newData: toJson(updated),
						},
					});
				}

				return {
					batchId: scanBatch.id,
					created_count: inserted.count,
					updated_count: overwrites.length,
					skippedClientScanIds,
					skippedNoTimestamp,
				};
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
		),
	);

	// Read back outside the transaction: this only builds the response and does
	// not need to participate in the write's isolation.
	const batch =
		upload.batchId === null
			? null
			: await prisma.scanBatch.findUnique({
					where: { id: upload.batchId },
					include: {
						inspector: {
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
						treeScans: true,
					},
				});

	return {
		batch,
		summary: {
			created_count: upload.created_count,
			updated_count: upload.updated_count,
			skipped:
				upload.skippedClientScanIds.length + upload.skippedNoTimestamp.length,
			skippedClientScanIds: upload.skippedClientScanIds,
			skippedNoTimestamp: upload.skippedNoTimestamp,
		},
	};
};

// Delete a scan batch only when it has no related tree scans
export const deleteScanBatch = async (id: number) => {
	const scanBatch = await prisma.scanBatch.findUnique({
		where: { id },
		include: {
			_count: {
				select: {
					treeScans: true,
				},
			},
		},
	});

	if (!scanBatch) {
		throw new AppError(
			404,
			customError("DATA_001"),
			SCAN_BATCHES_MESSAGES.NOT_FOUND,
		);
	}

	if (scanBatch._count.treeScans > 0) {
		throw new AppError(
			409,
			customError("DATA_004"),
			SCAN_BATCHES_MESSAGES.DELETE_BLOCKED_HAS_SCANS,
		);
	}

	await prisma.scanBatch.delete({
		where: { id },
	});

	return {
		success: true,
		message: SCAN_BATCHES_MESSAGES.DELETED,
	};
};
