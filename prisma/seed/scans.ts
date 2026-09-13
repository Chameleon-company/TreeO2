// Needs the project, the farmer and inspector user ids, and the tree type
// ids. Also needs the manager id, since one of the two scans below is
// corrected and the correction is attributed to them.
import { randomUUID } from "crypto";
import { prisma } from "./client";
import { TREE_SCAN_AUDIT_CHANGE_TYPES } from "../../src/modules/tree-scans/treeScans.constants";

export const seedScans = async (
	projectId: number,
	farmerId: number,
	inspectorId: number,
	managerId: number,
	sandalwoodId: number,
	teakId: number,
): Promise<void> => {
	let batch = await prisma.scanBatch.findFirst({
		where: { projectId, inspectorId },
	});
	batch ??= await prisma.scanBatch.create({
		data: { projectId, inspectorId, uploadedAt: new Date("2024-02-10") },
	});

	let validScan = await prisma.treeScan.findFirst({
		where: { fobId: "TL-AN-HB-000123" },
	});
	validScan ??= await prisma.treeScan.create({
		data: {
			fobId: "TL-AN-HB-000123",
			projectId,
			farmerId,
			inspectorId,
			speciesId: sandalwoodId,
			estimatedPlantedYear: 2023,
			estimatedPlantedMonth: 11,
			plantedDate: new Date("2023-11-15"),
			heightM: 1.85,
			circumferenceCm: 6.2,
			diameterCm: 1.97,
			latitude: -8.92,
			longitude: 125.5,
			batchId: batch.id,
			deviceId: "MOB-001",
			clientScanId: randomUUID(),
			scanTimestamp: new Date("2024-02-10T08:15:00Z"),
			isValid: true,
		},
	});

	let correctedScan = await prisma.treeScan.findFirst({
		where: { fobId: "TL-AN-HB-000124" },
	});
	correctedScan ??= await prisma.treeScan.create({
		data: {
			fobId: "TL-AN-HB-000124",
			projectId,
			farmerId,
			inspectorId,
			speciesId: teakId,
			estimatedPlantedYear: 2023,
			estimatedPlantedMonth: 11,
			plantedDate: new Date("2023-11-15"),
			heightM: 2.1,
			circumferenceCm: 9.4,
			diameterCm: 2.99,
			latitude: -8.925,
			longitude: 125.505,
			batchId: batch.id,
			deviceId: "MOB-001",
			clientScanId: randomUUID(),
			scanTimestamp: new Date("2024-02-10T08:22:00Z"),
			isCorrected: true,
			correctedBy: managerId,
			correctionReason:
				"Height was recorded as 21.0m during field capture, a decimal-place entry error on the mobile app. Corrected to 2.10m after review against photo evidence.",
			isValid: true,
		},
	});

	const existingAudit = await prisma.treeScanAudit.findFirst({
		where: { treeScanId: correctedScan.id },
	});
	if (!existingAudit) {
		await prisma.treeScanAudit.create({
			data: {
				treeScanId: correctedScan.id,
				changedBy: managerId,
				changeType: TREE_SCAN_AUDIT_CHANGE_TYPES.CORRECTED,
				changeReason:
					"Corrected mis-entered height (21.0m -> 2.10m, decimal-place error) after photo review.",
				oldData: { heightM: "21.0" },
				newData: { heightM: "2.10" },
			},
		});
	}
};
