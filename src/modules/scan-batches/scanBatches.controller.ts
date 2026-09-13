import { Request, Response, NextFunction } from "express";
import {
	createScanBatch,
	deleteScanBatch,
	getScanBatchById,
	getScanBatches,
} from "./scanBatches.service";

import {
	createScanBatchSchema,
	getScanBatchesQuerySchema,
	scanBatchIdParamSchema,
} from "./scan-batches.schema";

import { SCAN_BATCHES_MESSAGES } from "./scan-batches.constants";

const getCurrentUser = (req: Request) => ({
	id: Number(req.user?.sub),
	role: req.user?.role ?? "",
});

// Handle request to fetch paginated scan batches
export const getScanBatchesController = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const query = getScanBatchesQuerySchema.parse(req.query);

		const result = await getScanBatches(query, getCurrentUser(req));

		res.status(200).json({
			success: true,
			message: SCAN_BATCHES_MESSAGES.FETCHED,
			...result,
		});
	} catch (error) {
		next(error);
	}
};

// Handle request to fetch a single scan batch by ID
export const getScanBatchByIdController = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id } = scanBatchIdParamSchema.parse(req.params);

		const scanBatch = await getScanBatchById(id, getCurrentUser(req));

		res.status(200).json({
			success: true,
			message: SCAN_BATCHES_MESSAGES.FETCHED_ONE,
			data: scanBatch,
		});
	} catch (error) {
		next(error);
	}
};

// Handle request to create a new scan batch with tree scans
export const createScanBatchController = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const validatedData = createScanBatchSchema.parse(req.body);

		const { batch, summary } = await createScanBatch({
			...validatedData,
			inspector_id: getCurrentUser(req).id,
		});

		// All submitted scans already existed: idempotent no-op, nothing created.
		if (!batch) {
			res.status(200).json({
				success: true,
				message: SCAN_BATCHES_MESSAGES.ALL_DUPLICATES,
				data: null,
				summary,
			});
			return;
		}

		res.status(201).json({
			success: true,
			message:
				summary.skipped > 0
					? SCAN_BATCHES_MESSAGES.CREATED_WITH_DUPLICATES
					: SCAN_BATCHES_MESSAGES.CREATED,
			data: batch,
			summary,
		});
	} catch (error) {
		next(error);
	}
};

// Handle request to delete a scan batch
export const deleteScanBatchController = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id } = scanBatchIdParamSchema.parse(req.params);

		const result = await deleteScanBatch(id);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};
