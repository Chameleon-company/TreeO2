import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  CreateScanBatchInput,
  GetScanBatchesQueryInput,
} from "../schemas/scan-batches.schema";
import {
  SCAN_BATCHES_DEFAULTS,
  SCAN_BATCHES_ERRORS,
  SCAN_BATCHES_LIMITS,
  SCAN_BATCHES_MESSAGES,
  SCAN_BATCHES_ROLES,
} from "../constants/scan-batches.constants";

interface CurrentUser {
  id: number;
  role: string;
}

type CreateScanBatchServiceInput = CreateScanBatchInput & {
  inspector_id: number;
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

  if (currentUser.role === SCAN_BATCHES_ROLES.INSPECTOR) {
    where.inspectorId = currentUser.id;
  }

  if (currentUser.role === SCAN_BATCHES_ROLES.MANAGER) {
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



TreeO2 Project Proposal.pdf
PDF
go over it completely and i will give you code for scan batches api just tell if there any major bugs

Thought for a few seconds
Yes — I’ll check your Scan Batches API against the full TreeO2 spec.

Main things I’ll look for:

Inspector/Admin/Manager role access

batch upload creates scan_batches + related tree_scans

all scans in one batch use same project_id and inspector

inspector is active and assigned to the project

farmer belongs to project

tree type exists for that project

dates are not future

planted month is 1–12 and year is valid

no destructive delete if dependent scans exist

proper transactions so partial batch upload cannot happen

correct status codes and error format

The spec says /scan-batches should support GET, GET by id, POST by Inspector, and DELETE by Admin, with batch upload validation rules for same scanner/project and historical scan preservation. 


Send me the code.


constants:
export const SCAN_BATCHES_MESSAGES = {
  FETCHED: "Scan batches fetched successfully",
  FETCHED_ONE: "Scan batch fetched successfully",
  CREATED: "Scan batch uploaded successfully",
  DELETED: "Scan batch deleted successfully",

  NOT_FOUND: "Scan batch not found",
  INVALID_ID: "Invalid scan batch ID",

  CREATE_FAILED: "Failed to create scan batch",
  DELETE_FAILED: "Failed to delete scan batch",

  INVALID_SCANS_ARRAY: "Scans must be provided as a non-empty array",

  INSPECTOR_REQUIRED: "Inspector ID is required",
  PROJECT_REQUIRED: "Project ID is required",

  INSPECTOR_NOT_FOUND: "Inspector not found",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_INACTIVE: "Project is not active and cannot accept scan uploads",

  INVALID_INSPECTOR_ROLE: "User must have Inspector role",
  INVALID_FARMER_ROLE: "Selected farmer_id must belong to a Farmer user",

  FARMER_NOT_FOUND: "Farmer not found",
  FARMER_NOT_ASSIGNED: "Farmer is not assigned to the selected project",

  SPECIES_NOT_FOUND: "Tree species not found",
  SPECIES_NOT_IN_PROJECT: "Tree species is not assigned to this project",

  INSPECTOR_NOT_ASSIGNED: "Inspector is not assigned to the selected project",

  UNAUTHORIZED_ACCESS: "You do not have permission to access this scan batch",
  ADMIN_DELETE_ONLY: "Only Admin users can delete scan batches",

  INVALID_PLANTED_DATE: "Planted date cannot be in the future",
  INVALID_SCAN_DATE: "Scan timestamp cannot be in the future",
  INVALID_PLANTED_YEAR: "Estimated planted year must be between 1950 and the current year",
  INVALID_PLANTED_MONTH: "Estimated planted month must be between 1 and 12",
  INVALID_MEASUREMENT: "Tree measurement value is outside the allowed range",

  DELETE_BLOCKED_HAS_SCANS:
    "Scan batch cannot be deleted because it has related tree scans",
} as const;

export const SCAN_BATCHES_ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "SCAN_BATCH_NOT_FOUND",
  FORBIDDEN: "SCAN_BATCH_FORBIDDEN",
  CREATE_FAILED: "SCAN_BATCH_CREATE_FAILED",
  DELETE_FAILED: "SCAN_BATCH_DELETE_FAILED",
  DELETE_BLOCKED: "SCAN_BATCH_DELETE_BLOCKED",

  PROJECT_INACTIVE: "PROJECT_INACTIVE",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_ASSIGNED: "NOT_ASSIGNED_TO_PROJECT",
  SPECIES_NOT_IN_PROJECT: "SPECIES_NOT_IN_PROJECT",
  INVALID_DATE: "INVALID_DATE",
  INVALID_MEASUREMENT: "INVALID_MEASUREMENT",
} as const;

export const SCAN_BATCHES_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SCAN_BATCHES_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  INSPECTOR: "Inspector",
  FARMER: "Farmer",
} as const;

export const SCAN_BATCHES_LIMITS = {
  MAX_SCANS_PER_BATCH: 500,

  MIN_PLANTED_YEAR: 1950,

  MAX_HEIGHT_M: 100,
  MAX_DIAMETER_CM: 1000,
  MAX_CIRCUMFERENCE_CM: 4000,

  FOB_ID_MAX_LENGTH: 80,
  DEVICE_ID_MAX_LENGTH: 100,
} as const;

schemas:
import { z } from "zod";
import {
  SCAN_BATCHES_DEFAULTS,
  SCAN_BATCHES_LIMITS,
  SCAN_BATCHES_MESSAGES,
} from "../constants/scan-batches.constants";

const currentYear = new Date().getFullYear();

const futureDateValidator = (value: string | Date): boolean => {
  const parsedDate = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() <= Date.now();
};

const optionalPositiveNumber = (max: number) =>
  z.coerce
    .number()
    .positive()
    .max(max, SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT)
    .optional()
    .nullable();

const scanSchema = z.object({
  fob_id: z
    .string()
    .trim()
    .min(1, "fob_id is required")
    .max(SCAN_BATCHES_LIMITS.FOB_ID_MAX_LENGTH),

  farmer_id: z.coerce.number().int().positive("farmer_id must be a positive integer"),

  species_id: z.coerce.number().int().positive("species_id must be a positive integer"),

  estimated_planted_year: z.coerce
    .number()
    .int()
    .min(SCAN_BATCHES_LIMITS.MIN_PLANTED_YEAR, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_YEAR)
    .max(currentYear, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_YEAR),

  estimated_planted_month: z.coerce
    .number()
    .int()
    .min(1, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_MONTH)
    .max(12, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_MONTH),

  planted_date: z.coerce
    .date()
    .refine(futureDateValidator, SCAN_BATCHES_MESSAGES.INVALID_PLANTED_DATE)
    .optional()
    .nullable(),

  height_m: optionalPositiveNumber(SCAN_BATCHES_LIMITS.MAX_HEIGHT_M),

  diameter_cm: optionalPositiveNumber(SCAN_BATCHES_LIMITS.MAX_DIAMETER_CM),

  circumference_cm: optionalPositiveNumber(SCAN_BATCHES_LIMITS.MAX_CIRCUMFERENCE_CM),

  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),

  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  photo_id: z.string().uuid("photo_id must be a valid UUID").optional().nullable(),

  device_id: z
    .string()
    .trim()
    .max(SCAN_BATCHES_LIMITS.DEVICE_ID_MAX_LENGTH)
    .optional()
    .nullable(),
});

export const createScanBatchSchema = z.object({
  project_id: z.coerce.number().int().positive(SCAN_BATCHES_MESSAGES.PROJECT_REQUIRED),

  uploaded_at: z.coerce
    .date()
    .refine(futureDateValidator, "Uploaded date cannot be in the future")
    .optional()
    .nullable(),

  scans: z
    .array(scanSchema)
    .min(1, SCAN_BATCHES_MESSAGES.INVALID_SCANS_ARRAY)
    .max(SCAN_BATCHES_LIMITS.MAX_SCANS_PER_BATCH),
});

export const getScanBatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(SCAN_BATCHES_DEFAULTS.PAGE),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(SCAN_BATCHES_DEFAULTS.MAX_LIMIT)
    .default(SCAN_BATCHES_DEFAULTS.LIMIT),

  project_id: z.coerce.number().int().positive().optional(),

  inspector_id: z.coerce.number().int().positive().optional(),
});

export const scanBatchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(SCAN_BATCHES_MESSAGES.INVALID_ID),
});

export type CreateScanBatchInput = z.infer<typeof createScanBatchSchema>;
export type GetScanBatchesQueryInput = z.infer<typeof getScanBatchesQuerySchema>;
export type ScanBatchIdParamInput = z.infer<typeof scanBatchIdParamSchema>;

service:
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  CreateScanBatchInput,
  GetScanBatchesQueryInput,
} from "../schemas/scan-batches.schema";
import {
  SCAN_BATCHES_DEFAULTS,
  SCAN_BATCHES_ERRORS,
  SCAN_BATCHES_LIMITS,
  SCAN_BATCHES_MESSAGES,
  SCAN_BATCHES_ROLES,
} from "../constants/scan-batches.constants";

interface CurrentUser {
  id: number;
  role: string;
}

type CreateScanBatchServiceInput = CreateScanBatchInput & {
  inspector_id: number;
};

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

  if (currentUser.role === SCAN_BATCHES_ROLES.INSPECTOR) {
    where.inspectorId = currentUser.id;
  }

  if (currentUser.role === SCAN_BATCHES_ROLES.MANAGER) {
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
      SCAN_BATCHES_MESSAGES.NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (
    currentUser.role === SCAN_BATCHES_ROLES.INSPECTOR &&
    scanBatch.inspectorId !== currentUser.id
  ) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
      SCAN_BATCHES_ERRORS.FORBIDDEN,
    );
  }

  if (currentUser.role === SCAN_BATCHES_ROLES.MANAGER) {
    const hasAccess = await prisma.userProject.findFirst({
      where: {
        userId: currentUser.id,
        projectId: scanBatch.projectId,
      },
    });

    if (!hasAccess) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
        SCAN_BATCHES_ERRORS.FORBIDDEN,
      );
    }
  }

  return scanBatch;
};

export const createScanBatch = async (data: CreateScanBatchServiceInput) => {
  const inspector = await prisma.user.findUnique({
    where: { id: data.inspector_id },
    include: {
      role: true,
    },
  });

  if (!inspector) {
    throw new AppError(
      404,
      SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (inspector.role?.name !== SCAN_BATCHES_ROLES.INSPECTOR) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.INVALID_INSPECTOR_ROLE,
      SCAN_BATCHES_ERRORS.INVALID_ROLE,
    );
  }

  if (!inspector.accountActive || !inspector.canSignIn) {
    throw new AppError(
      403,
      "Inspector account is inactive or cannot sign in",
      SCAN_BATCHES_ERRORS.FORBIDDEN,
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: data.project_id },
  });

  if (!project) {
    throw new AppError(
      404,
      SCAN_BATCHES_MESSAGES.PROJECT_NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (!project.isActive) {
    throw new AppError(
      422,
      SCAN_BATCHES_MESSAGES.PROJECT_INACTIVE,
      SCAN_BATCHES_ERRORS.PROJECT_INACTIVE,
    );
  }

  const inspectorAssignment = await prisma.userProject.findFirst({
    where: {
      userId: data.inspector_id,
      projectId: data.project_id,
    },
  });

  if (!inspectorAssignment) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_ASSIGNED,
      SCAN_BATCHES_ERRORS.NOT_ASSIGNED,
    );
  }

  for (const scan of data.scans) {
    const farmer = await prisma.user.findUnique({
      where: { id: scan.farmer_id },
      include: {
        role: true,
      },
    });

    if (!farmer) {
      throw new AppError(
        404,
        SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
        SCAN_BATCHES_ERRORS.NOT_FOUND,
      );
    }

    if (farmer.role?.name !== SCAN_BATCHES_ROLES.FARMER) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.INVALID_FARMER_ROLE,
        SCAN_BATCHES_ERRORS.INVALID_ROLE,
      );
    }

    const farmerAssignment = await prisma.userProject.findFirst({
      where: {
        userId: scan.farmer_id,
        projectId: data.project_id,
      },
    });

    if (!farmerAssignment) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.FARMER_NOT_ASSIGNED,
        SCAN_BATCHES_ERRORS.NOT_ASSIGNED,
      );
    }

    const species = await prisma.treeType.findUnique({
      where: { id: scan.species_id },
    });

    if (!species) {
      throw new AppError(
        404,
        SCAN_BATCHES_MESSAGES.SPECIES_NOT_FOUND,
        SCAN_BATCHES_ERRORS.NOT_FOUND,
      );
    }

    const projectSpecies = await prisma.projectTreeType.findFirst({
      where: {
        projectId: data.project_id,
        treeTypeId: scan.species_id,
      },
    });

    if (!projectSpecies) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.SPECIES_NOT_IN_PROJECT,
        SCAN_BATCHES_ERRORS.SPECIES_NOT_IN_PROJECT,
      );
    }

    if (
      scan.height_m &&
      scan.height_m > SCAN_BATCHES_LIMITS.MAX_HEIGHT_M
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }

    if (
      scan.diameter_cm &&
      scan.diameter_cm > SCAN_BATCHES_LIMITS.MAX_DIAMETER_CM
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }

    if (
      scan.circumference_cm &&
      scan.circumference_cm > SCAN_BATCHES_LIMITS.MAX_CIRCUMFERENCE_CM
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const scanBatch = await tx.scanBatch.create({
      data: {
        inspectorId: data.inspector_id,
        projectId: data.project_id,
        uploadedAt: data.uploaded_at ?? new Date(),
      },
    });

    await tx.treeScan.createMany({
      data: data.scans.map((scan) => ({
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
        deviceId: scan.device_id ?? null,
        batchId: scanBatch.id,
      })),
    });

    return tx.scanBatch.findUnique({
      where: {
        id: scanBatch.id,
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
        treeScans: true,
      },
    });
  });
};

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
      SCAN_BATCHES_MESSAGES.NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (scanBatch._count.treeScans > 0) {
    throw new AppError(
      409,
      SCAN_BATCHES_MESSAGES.DELETE_BLOCKED_HAS_SCANS,
      SCAN_BATCHES_ERRORS.DELETE_BLOCKED,
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

controller:
// controllers/scanBatches.controller.ts

import { Request, Response, NextFunction } from "express";
import {
  createScanBatch,
  deleteScanBatch,
  getScanBatchById,
  getScanBatches,
} from "../services/scanBatches.service";
import {
  createScanBatchSchema,
  getScanBatchesQuerySchema,
  scanBatchIdParamSchema,
} from "../schemas/scan-batches.schema";
import { SCAN_BATCHES_MESSAGES } from "../constants/scan-batches.constants";

export const getScanBatchesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = getScanBatchesQuerySchema.parse(req.query);

    const result = await getScanBatches(query, {
      id: req.user!.id,
      role: req.user!.role,
    });

    res.status(200).json({
      success: true,
      message: SCAN_BATCHES_MESSAGES.FETCHED,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getScanBatchByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = scanBatchIdParamSchema.parse(req.params);

    const scanBatch = await getScanBatchById(id, {
      id: req.user!.id,
      role: req.user!.role,
    });

    res.status(200).json({
      success: true,
      message: SCAN_BATCHES_MESSAGES.FETCHED_ONE,
      data: scanBatch,
    });
  } catch (error) {
    next(error);
  }
};

export const createScanBatchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedData = createScanBatchSchema.parse(req.body);

    const scanBatch = await createScanBatch({
      ...validatedData,
      inspector_id: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: SCAN_BATCHES_MESSAGES.CREATED,
      data: scanBatch,
    });
  } catch (error) {
    next(error);
  }
};

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

Thought for a few seconds
Overall: no major blocking bug in the basic flow. It is mostly solid. But I found 3 important issues you should fix.

Major issues
Manager role can maybe create scan batch if route allows it
Your service forces inspector_id: req.user!.id, then checks that user role is Inspector. So Manager/Admin will fail in service, but better to block this clearly in route middleware. Spec says /scan-batches POST is for Inspector only. 


Batch validation is not inside the transaction
You validate farmers/species/project assignments before transaction, then create batch and scans inside transaction. This is mostly okay, but there is still a small race-condition risk if assignments/project status change between validation and insert. Not huge for capstone, but better practice is to put validation + creation in the same transaction.

Possible Prisma relation mismatch
You use:

include: { role: true }
and:

inspector.role?.name
This only works if your User model has a single relation called role. But your spec has both role integer and user_roles junction table. If your actual Prisma schema uses roleId relation, fine. If it uses many-to-many roles, this will break.

Medium issues
You do not validate scan_timestamp, but the spec mentions scan timestamp cannot be future.

uploaded_at is allowed from request body. That is okay, but normally backend should control upload time.

deleteScanBatch has no role check inside service. If route middleware is missing, anyone authenticated could delete. Make sure route has Admin-only middleware.

You check measurements twice: Zod already checks max, then service checks again. Not harmful, just duplicated.

optionalPositiveNumber() rejects 0. If a measurement can be zero during early/unknown scan, this may be too strict. If measurements are optional, it is okay.

Good things
Uses pagination.

Inspector can only see own batches.

Manager access is project-limited.

Batch creation uses transaction for insert.

Blocks deletion when tree scans exist.

Validates farmer assignment, inspector assignment, tree species assignment, active project, future dates, planted year/month.

Verdict: good implementation, not risky, but I would fix role middleware, Prisma role relation confirmation, and Admin-only delete route before approving.


docs:
/**
 * @swagger
 * tags:
 *   name: Scan Batches
 *   description: Scan batch upload and management endpoints
 */

/**
 * @swagger
 * /scan-batches:
 *   get:
 *     summary: Retrieve scan batches
 *     description: Admin can view all batches. Managers can view batches for assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: inspector_id
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Scan batches fetched successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   get:
 *     summary: Retrieve a scan batch by ID
 *     description: Admin can view any batch. Managers can view batches from assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch fetched successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You do not have permission to access this scan batch
 *       404:
 *         description: Scan batch not found
 */

/**
 * @swagger
 * /scan-batches:
 *   post:
 *     summary: Upload a new scan batch
 *     description: Inspector-only endpoint. Creates one scan batch and associates all submitted tree scans with that batch. All scans must belong to the same inspector and project. Duplicate fob_id values inside the same batch upload are rejected to prevent accidental duplicate submissions. Fob recycling is not automatically applied.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspector_id
 *               - project_id
 *               - scans
 *             properties:
 *               inspector_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               project_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-05-20T10:35:00.000Z
 *               scans:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 500
 *                 items:
 *                   type: object
 *                   required:
 *                     - fob_id
 *                     - farmer_id
 *                     - species_id
 *                     - estimated_planted_year
 *                     - estimated_planted_month
 *                   properties:
 *                     fob_id:
 *                       type: string
 *                       maxLength: 80
 *                       example: NFC-001
 *                     farmer_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 10
 *                     species_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                     estimated_planted_year:
 *                       type: integer
 *                       minimum: 1950
 *                       example: 2024
 *                     estimated_planted_month:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 12
 *                       example: 5
 *                     planted_date:
 *                       type: string
 *                       format: date
 *                       example: 2024-05-20
 *                     height_m:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 2.5
 *                     circumference_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 4000
 *                       example: 45.3
 *                     diameter_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1000
 *                       example: 14.4
 *                     latitude:
 *                       type: number
 *                       minimum: -90
 *                       maximum: 90
 *                       example: -8.5569
 *                     longitude:
 *                       type: number
 *                       minimum: -180
 *                       maximum: 180
 *                       example: 125.5603
 *                     device_id:
 *                       type: string
 *                       maxLength: 100
 *                       example: MOB-001
 *                     photo_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *           example:
 *             inspector_id: 2
 *             project_id: 1
 *             uploaded_at: 2024-05-20T10:35:00.000Z
 *             scans:
 *               - fob_id: NFC-001
 *                 farmer_id: 10
 *                 species_id: 2
 *                 estimated_planted_year: 2024
 *                 estimated_planted_month: 5
 *                 planted_date: 2024-05-20
 *                 height_m: 2.5
 *                 circumference_cm: 45.3
 *                 diameter_cm: 14.4
 *                 latitude: -8.5569
 *                 longitude: 125.5603
 *                 device_id: MOB-001
 *     responses:
 *       201:
 *         description: Scan batch uploaded successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not allowed to upload this scan batch
 *       404:
 *         description: Inspector, project, farmer, or species not found
 *       409:
 *         description: Duplicate fob_id found within the same batch upload
 *       422:
 *         description: Business rule validation failed, such as inactive project, farmer not assigned, species not assigned to project, or invalid measurement/date values
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   delete:
 *     summary: Delete a scan batch
 *     description: Admin-only endpoint. A scan batch cannot be deleted if it has related tree scans. This protects historical scan data.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch deleted successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only Admin users can delete scan batches
 *       404:
 *         description: Scan batch not found
 *       409:
 *         description: Scan batch cannot be deleted because it has related tree scans
 */

routes:
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

import {
  getScanBatchesController,
  getScanBatchByIdController,
  createScanBatchController,
  deleteScanBatchController,
} from "../controllers/scanBatches.controller";

import { SCAN_BATCHES_ROLES } from "../constants/scan-batches.constants";

import "../docs/scan-batches.docs";

const router = Router();

// GET /scan-batches
// Admin: all batches, Manager: assigned project batches, Inspector: own batches
router.get(
  "/",
  authenticate,
  authorize(
    SCAN_BATCHES_ROLES.ADMIN,
    SCAN_BATCHES_ROLES.MANAGER,
    SCAN_BATCHES_ROLES.INSPECTOR,
  ),
  getScanBatchesController,
);

// GET /scan-batches/:id
// Admin: any batch, Manager: assigned project batch, Inspector: own batch
router.get(
  "/:id",
  authenticate,
  authorize(
    SCAN_BATCHES_ROLES.ADMIN,
    SCAN_BATCHES_ROLES.MANAGER,
    SCAN_BATCHES_ROLES.INSPECTOR,
  ),
  getScanBatchByIdController,
);

// POST /scan-batches
// Inspector only: upload a scan batch with related tree scans
router.post(
  "/",
  authenticate,
  authorize(SCAN_BATCHES_ROLES.INSPECTOR),
  createScanBatchController,
);

// DELETE /scan-batches/:id
// Admin only: delete batch only when it has no related tree scans
router.delete(
  "/:id",
  authenticate,
  authorize(SCAN_BATCHES_ROLES.ADMIN),
  deleteScanBatchController,
);

export default router;

Good — the routes fix the biggest role issue. Now POST is Inspector-only and DELETE is Admin-only.

Major issue left: Swagger docs do not match your actual API.

In your controller, inspector_id comes from:

inspector_id: req.user!.id
So the request body does not accept inspector_id. But your Swagger says inspector_id is required. Remove inspector_id from docs request body.

Also this line in docs is wrong:

Duplicate fob_id values inside the same batch upload are rejected

Your schema/service does not reject duplicate fob_id inside the batch. Either remove that sentence + 409 response, or add duplicate checking in schema/service.

Recommended quick fix in docs:

required:
  - project_id
  - scans
Remove:

inspector_id:
  type: integer
Remove this response unless you implement it:

409:
  description: Duplicate fob_id found within the same batch upload
Everything else looks aligned: GET access, GET by ID access, POST Inspector-only, DELETE Admin-only, and delete blocked when related scans exist.


tell me exactly where to make changes

Make changes only in docs/scan-batches.docs.ts.

1. In POST /scan-batches, remove inspector_id from required
Find:

required:
  - inspector_id
  - project_id
  - scans
Change to:

required:
  - project_id
  - scans
2. Remove inspector_id property
Delete this block:

inspector_id:
  type: integer
  minimum: 1
  example: 2
3. Remove inspector_id from example
Find:

example:
  inspector_id: 2
  project_id: 1
Change to:

example:
  project_id: 1
4. Fix duplicate fob sentence
Find this in description:

Duplicate fob_id values inside the same batch upload are rejected to prevent accidental duplicate submissions.
Delete that sentence.

5. Remove 409 response
Delete this block:

409:
  description: Duplicate fob_id found within the same batch upload
That’s it. Your routes are fine.


Almost done. You still need to remove two duplicate-fob references.

1. Change POST description
Find this line:

*     description: Inspector-only endpoint. Creates one scan batch and associates all submitted tree scans with that batch. All scans must belong to the same inspector and project. Duplicate fob_id values inside the same batch upload are rejected to prevent accidental duplicate submissions. Fob recycling is not automatically applied.
Change to:

*     description: Inspector-only endpoint. Creates one scan batch and associates all submitted tree scans with that batch. All scans must belong to the same inspector and project. Fob recycling is not automatically applied.
2. Remove POST 409 response
Delete this block under POST responses:

*       409:
*         description: Duplicate fob_id found within the same batch upload
Keep the DELETE 409 response. That one is correct.


/**
 * @swagger
 * tags:
 *   name: Scan Batches
 *   description: Scan batch upload and management endpoints
 */

/**
 * @swagger
 * /scan-batches:
 *   get:
 *     summary: Retrieve scan batches
 *     description: Admin can view all batches. Managers can view batches for assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: inspector_id
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Scan batches fetched successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   get:
 *     summary: Retrieve a scan batch by ID
 *     description: Admin can view any batch. Managers can view batches from assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch fetched successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You do not have permission to access this scan batch
 *       404:
 *         description: Scan batch not found
 */

/**
 * @swagger
 * /scan-batches:
 *   post:
 *     summary: Upload a new scan batch
 *     description: Inspector-only endpoint. Creates one scan batch and associates all submitted tree scans with that batch. All scans must belong to the same inspector and project. Fob recycling is not automatically applied.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - scans
 *             properties:
 *               project_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-05-20T10:35:00.000Z
 *               scans:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 500
 *                 items:
 *                   type: object
 *                   required:
 *                     - fob_id
 *                     - farmer_id
 *                     - species_id
 *                     - estimated_planted_year
 *                     - estimated_planted_month
 *                   properties:
 *                     fob_id:
 *                       type: string
 *                       maxLength: 80
 *                       example: NFC-001
 *                     farmer_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 10
 *                     species_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                     estimated_planted_year:
 *                       type: integer
 *                       minimum: 1950
 *                       example: 2024
 *                     estimated_planted_month:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 12
 *                       example: 5
 *                     planted_date:
 *                       type: string
 *                       format: date
 *                       example: 2024-05-20
 *                     height_m:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 2.5
 *                     circumference_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 4000
 *                       example: 45.3
 *                     diameter_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1000
 *                       example: 14.4
 *                     latitude:
 *                       type: number
 *                       minimum: -90
 *                       maximum: 90
 *                       example: -8.5569
 *                     longitude:
 *                       type: number
 *                       minimum: -180
 *                       maximum: 180
 *                       example: 125.5603
 *                     device_id:
 *                       type: string
 *                       maxLength: 100
 *                       example: MOB-001
 *                     photo_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *           example:
 *             project_id: 1
 *             uploaded_at: 2024-05-20T10:35:00.000Z
 *             scans:
 *               - fob_id: NFC-001
 *                 farmer_id: 10
 *                 species_id: 2
 *                 estimated_planted_year: 2024
 *                 estimated_planted_month: 5
 *                 planted_date: 2024-05-20
 *                 height_m: 2.5
 *                 circumference_cm: 45.3
 *                 diameter_cm: 14.4
 *                 latitude: -8.5569
 *                 longitude: 125.5603
 *                 device_id: MOB-001
 *     responses:
 *       201:
 *         description: Scan batch uploaded successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not allowed to upload this scan batch
 *       404:
 *         description: Inspector, project, farmer, or species not found
 *       422:
 *         description: Business rule validation failed, such as inactive project, farmer not assigned, species not assigned to project, or invalid measurement/date values
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   delete:
 *     summary: Delete a scan batch
 *     description: Admin-only endpoint. A scan batch cannot be deleted if it has related tree scans. This protects historical scan data.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch deleted successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only Admin users can delete scan batches
 *       404:
 *         description: Scan batch not found
 *       409:
 *         description: Scan batch cannot be deleted because it has related tree scans
 */

Yes — now the docs are aligned with your implementation.

At this point the Scan Batches module looks good overall:

routes aligned with RBAC

Swagger aligned with actual controller behavior

validations mostly match business rules

delete protection implemented

pagination/access control implemented correctly

Only remaining improvement areas are optional/polish level:

move validations into transaction

maybe optimize N+1 queries inside loop

add duplicate fob_id prevention if product owner wants it

add scan timestamp field later if required by schema

No major architectural bug left from what you shared.


everything good?
if yes. now give single line comments for service file for each endpoint

// Fetch paginated scan batches with role-based access filtering
export const getScanBatches = async (

// Retrieve a single scan batch with access control validation
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
      SCAN_BATCHES_MESSAGES.NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (
    currentUser.role === SCAN_BATCHES_ROLES.INSPECTOR &&
    scanBatch.inspectorId !== currentUser.id
  ) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
      SCAN_BATCHES_ERRORS.FORBIDDEN,
    );
  }

  if (currentUser.role === SCAN_BATCHES_ROLES.MANAGER) {
    const hasAccess = await prisma.userProject.findFirst({
      where: {
        userId: currentUser.id,
        projectId: scanBatch.projectId,
      },
    });

    if (!hasAccess) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
        SCAN_BATCHES_ERRORS.FORBIDDEN,
      );
    }
  }

  return scanBatch;
};

// Validate and create a scan batch with related tree scans in a transaction
export const createScanBatch = async (data: CreateScanBatchServiceInput) => {
  const inspector = await prisma.user.findUnique({
    where: { id: data.inspector_id },
    include: {
      role: true,
    },
  });

  if (!inspector) {
    throw new AppError(
      404,
      SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (inspector.role?.name !== SCAN_BATCHES_ROLES.INSPECTOR) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.INVALID_INSPECTOR_ROLE,
      SCAN_BATCHES_ERRORS.INVALID_ROLE,
    );
  }

  if (!inspector.accountActive || !inspector.canSignIn) {
    throw new AppError(
      403,
      "Inspector account is inactive or cannot sign in",
      SCAN_BATCHES_ERRORS.FORBIDDEN,
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: data.project_id },
  });

  if (!project) {
    throw new AppError(
      404,
      SCAN_BATCHES_MESSAGES.PROJECT_NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (!project.isActive) {
    throw new AppError(
      422,
      SCAN_BATCHES_MESSAGES.PROJECT_INACTIVE,
      SCAN_BATCHES_ERRORS.PROJECT_INACTIVE,
    );
  }

  const inspectorAssignment = await prisma.userProject.findFirst({
    where: {
      userId: data.inspector_id,
      projectId: data.project_id,
    },
  });

  if (!inspectorAssignment) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_ASSIGNED,
      SCAN_BATCHES_ERRORS.NOT_ASSIGNED,
    );
  }

  for (const scan of data.scans) {
    const farmer = await prisma.user.findUnique({
      where: { id: scan.farmer_id },
      include: {
        role: true,
      },
    });

    if (!farmer) {
      throw new AppError(
        404,
        SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
        SCAN_BATCHES_ERRORS.NOT_FOUND,
      );
    }

    if (farmer.role?.name !== SCAN_BATCHES_ROLES.FARMER) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.INVALID_FARMER_ROLE,
        SCAN_BATCHES_ERRORS.INVALID_ROLE,
      );
    }

    const farmerAssignment = await prisma.userProject.findFirst({
      where: {
        userId: scan.farmer_id,
        projectId: data.project_id,
      },
    });

    if (!farmerAssignment) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.FARMER_NOT_ASSIGNED,
        SCAN_BATCHES_ERRORS.NOT_ASSIGNED,
      );
    }

    const species = await prisma.treeType.findUnique({
      where: { id: scan.species_id },
    });

    if (!species) {
      throw new AppError(
        404,
        SCAN_BATCHES_MESSAGES.SPECIES_NOT_FOUND,
        SCAN_BATCHES_ERRORS.NOT_FOUND,
      );
    }

    const projectSpecies = await prisma.projectTreeType.findFirst({
      where: {
        projectId: data.project_id,
        treeTypeId: scan.species_id,
      },
    });

    if (!projectSpecies) {
      throw new AppError(
        403,
        SCAN_BATCHES_MESSAGES.SPECIES_NOT_IN_PROJECT,
        SCAN_BATCHES_ERRORS.SPECIES_NOT_IN_PROJECT,
      );
    }

    if (
      scan.height_m &&
      scan.height_m > SCAN_BATCHES_LIMITS.MAX_HEIGHT_M
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }

    if (
      scan.diameter_cm &&
      scan.diameter_cm > SCAN_BATCHES_LIMITS.MAX_DIAMETER_CM
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }

    if (
      scan.circumference_cm &&
      scan.circumference_cm > SCAN_BATCHES_LIMITS.MAX_CIRCUMFERENCE_CM
    ) {
      throw new AppError(
        422,
        SCAN_BATCHES_MESSAGES.INVALID_MEASUREMENT,
        SCAN_BATCHES_ERRORS.INVALID_MEASUREMENT,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const scanBatch = await tx.scanBatch.create({
      data: {
        inspectorId: data.inspector_id,
        projectId: data.project_id,
        uploadedAt: data.uploaded_at ?? new Date(),
      },
    });

    await tx.treeScan.createMany({
      data: data.scans.map((scan) => ({
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
        deviceId: scan.device_id ?? null,
        batchId: scanBatch.id,
      })),
    });

    return tx.scanBatch.findUnique({
      where: {
        id: scanBatch.id,
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
        treeScans: true,
      },
    });
  });
};

// Delete a scan batch only if it has no related tree scans
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
      SCAN_BATCHES_MESSAGES.NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (scanBatch._count.treeScans > 0) {
    throw new AppError(
      409,
      SCAN_BATCHES_MESSAGES.DELETE_BLOCKED_HAS_SCANS,
      SCAN_BATCHES_ERRORS.DELETE_BLOCKED,
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