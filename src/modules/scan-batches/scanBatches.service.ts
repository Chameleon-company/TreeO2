import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
  CreateScanBatchInput,
  GetScanBatchesQueryInput,
} from "./scan-batches.schema";
import {
  SCAN_BATCHES_AUTH_ROLES,
  SCAN_BATCHES_DB_ROLES,
  SCAN_BATCHES_DEFAULTS,
  SCAN_BATCHES_ERRORS,
  SCAN_BATCHES_LIMITS,
  SCAN_BATCHES_MESSAGES,
} from "./scan-batches.constants";

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
      SCAN_BATCHES_MESSAGES.NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (
    currentUser.role === SCAN_BATCHES_AUTH_ROLES.INSPECTOR &&
    scanBatch.inspectorId !== currentUser.id
  ) {
    throw new AppError(
      403,
      SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
      SCAN_BATCHES_ERRORS.FORBIDDEN,
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
        SCAN_BATCHES_MESSAGES.UNAUTHORIZED_ACCESS,
        SCAN_BATCHES_ERRORS.FORBIDDEN,
      );
    }
  }

  return scanBatch;
};

// Validate and create a scan batch with related tree scans
export const createScanBatch = async (data: CreateScanBatchServiceInput) => {
  const inspector = await prisma.user.findUnique({
    where: { id: data.inspector_id },
    include: {
      primaryRole: true,
    },
  });

  if (!inspector) {
    throw new AppError(
      404,
      SCAN_BATCHES_MESSAGES.INSPECTOR_NOT_FOUND,
      SCAN_BATCHES_ERRORS.NOT_FOUND,
    );
  }

  if (inspector.primaryRole?.name !== SCAN_BATCHES_DB_ROLES.INSPECTOR) {
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
        primaryRole: true,
      },
    });

    if (!farmer) {
      throw new AppError(
        404,
        SCAN_BATCHES_MESSAGES.FARMER_NOT_FOUND,
        SCAN_BATCHES_ERRORS.NOT_FOUND,
      );
    }

    if (farmer.primaryRole?.name !== SCAN_BATCHES_DB_ROLES.FARMER) {
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

    if (scan.height_m && scan.height_m > SCAN_BATCHES_LIMITS.MAX_HEIGHT_M) {
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
