import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import { TREE_SCAN_INCLUDE, TREE_SCAN_MESSAGES } from "./treeScans.constants";
import type {
  CreateTreeScanInput,
  ListTreeScansQuery,
  UpdateTreeScanInput,
} from "./treeScans.schemas";

// Ensure project exists and is active
const ensureProjectExists = async (projectId: number) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, isActive: true },
  });

  if (!project) {
    throw new AppError(
      404,
      TREE_SCAN_MESSAGES.PROJECT_NOT_FOUND,
      ERROR_CODES.DATA_001,
    );
  }

  if (!project.isActive) {
    throw new AppError(
      400,
      TREE_SCAN_MESSAGES.PROJECT_INACTIVE,
      ERROR_CODES.VAL_002,
    );
  }

  return project;
};

// Ensure user exists and account is active
const ensureUserExists = async (userId: number, message: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, accountActive: true },
  });

  if (!user) {
    throw new AppError(404, message, ERROR_CODES.DATA_001);
  }

  if (!user.accountActive) {
    throw new AppError(400, "User account is inactive", ERROR_CODES.VAL_002);
  }

  return user;
};

// Ensure user is assigned to the project
const ensureUserAssignedToProject = async (
  userId: number,
  projectId: number,
  message: string,
) => {
  const assignment = await prisma.userProject.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });

  if (!assignment) {
    throw new AppError(403, message, ERROR_CODES.AUTH_007);
  }
};

// Ensure tree species exists and is assigned to the project
const ensureSpeciesAssignedToProject = async (
  projectId: number,
  speciesId: number,
) => {
  const species = await prisma.treeType.findUnique({
    where: { id: speciesId },
    select: { id: true },
  });

  if (!species) {
    throw new AppError(
      404,
      TREE_SCAN_MESSAGES.SPECIES_NOT_FOUND,
      ERROR_CODES.DATA_001,
    );
  }

  const projectTreeType = await prisma.projectTreeType.findUnique({
    where: {
      projectId_treeTypeId: {
        projectId,
        treeTypeId: speciesId,
      },
    },
  });

  if (!projectTreeType) {
    throw new AppError(
      400,
      TREE_SCAN_MESSAGES.SPECIES_NOT_ASSIGNED,
      ERROR_CODES.VAL_002,
    );
  }
};

// Ensure tree scan exists
const ensureScanExists = async (id: number) => {
  const scan = await prisma.treeScan.findUnique({
    where: { id },
    include: TREE_SCAN_INCLUDE,
  });

  if (!scan) {
    throw new AppError(
      404,
      TREE_SCAN_MESSAGES.SCAN_NOT_FOUND,
      ERROR_CODES.DATA_001,
    );
  }

  return scan;
};

// Service layer for managing tree scan operations
export class TreeScansService {
  // List tree scans with pagination and filtering
  async listTreeScans(query: ListTreeScansQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.TreeScanWhereInput = {
      ...(query.projectId !== undefined ? { projectId: query.projectId } : {}),
      ...(query.farmerId !== undefined ? { farmerId: query.farmerId } : {}),
      ...(query.inspectorId !== undefined
        ? { inspectorId: query.inspectorId }
        : {}),
      ...(query.speciesId !== undefined ? { speciesId: query.speciesId } : {}),
      ...(query.batchId !== undefined ? { batchId: query.batchId } : {}),
      ...(query.isArchived !== undefined
        ? { isArchived: query.isArchived }
        : {}),
      ...(query.isValid !== undefined ? { isValid: query.isValid } : {}),
    };

    try {
      const [data, total] = await Promise.all([
        prisma.treeScan.findMany({
          where,
          skip,
          take: limit,
          include: TREE_SCAN_INCLUDE,
          orderBy: { createdAt: "desc" },
        }),
        prisma.treeScan.count({ where }),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Get a single tree scan by ID
  async getTreeScanById(id: number) {
    try {
      return await ensureScanExists(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Create a new tree scan
  async createTreeScan(data: CreateTreeScanInput) {
    try {
      await ensureProjectExists(data.projectId);

      await ensureUserExists(
        data.farmerId,
        TREE_SCAN_MESSAGES.FARMER_NOT_FOUND,
      );
      await ensureUserExists(
        data.inspectorId,
        TREE_SCAN_MESSAGES.INSPECTOR_NOT_FOUND,
      );

      await ensureUserAssignedToProject(
        data.farmerId,
        data.projectId,
        TREE_SCAN_MESSAGES.FARMER_NOT_ASSIGNED,
      );

      await ensureUserAssignedToProject(
        data.inspectorId,
        data.projectId,
        TREE_SCAN_MESSAGES.INSPECTOR_NOT_ASSIGNED,
      );

      await ensureSpeciesAssignedToProject(data.projectId, data.speciesId);

      return await prisma.treeScan.create({
        data: {
          fobId: data.fobId,
          projectId: data.projectId,
          farmerId: data.farmerId,
          inspectorId: data.inspectorId,
          speciesId: data.speciesId,
          estimatedPlantedYear: data.estimatedPlantedYear,
          estimatedPlantedMonth: data.estimatedPlantedMonth,
          plantedDate: data.plantedDate,
          heightM: data.heightM,
          circumferenceCm: data.circumferenceCm,
          diameterCm: data.diameterCm,
          latitude: data.latitude,
          longitude: data.longitude,
          photoId: data.photoId,
          batchId: data.batchId,
          deviceId: data.deviceId,
          validationNotes: data.validationNotes,
        },
        include: TREE_SCAN_INCLUDE,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new AppError(409, ERROR_CODES.DATA_001, ERROR_CODES.DATA_001);
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Update an existing tree scan and create audit log
  async updateTreeScan(
    id: number,
    data: UpdateTreeScanInput,
    changedBy: number,
  ) {
    try {
      const existingScan = await ensureScanExists(id);

      if (
        data.projectId !== undefined ||
        data.farmerId !== undefined ||
        data.inspectorId !== undefined ||
        data.speciesId !== undefined
      ) {
        const nextProjectId = data.projectId ?? existingScan.projectId;
        const nextFarmerId = data.farmerId ?? existingScan.farmerId;
        const nextInspectorId = data.inspectorId ?? existingScan.inspectorId;
        const nextSpeciesId = data.speciesId ?? existingScan.speciesId;

        await ensureProjectExists(nextProjectId);
        await ensureUserExists(
          nextFarmerId,
          TREE_SCAN_MESSAGES.FARMER_NOT_FOUND,
        );
        await ensureUserExists(
          nextInspectorId,
          TREE_SCAN_MESSAGES.INSPECTOR_NOT_FOUND,
        );
        await ensureUserAssignedToProject(
          nextFarmerId,
          nextProjectId,
          TREE_SCAN_MESSAGES.FARMER_NOT_ASSIGNED,
        );
        await ensureUserAssignedToProject(
          nextInspectorId,
          nextProjectId,
          TREE_SCAN_MESSAGES.INSPECTOR_NOT_ASSIGNED,
        );
        await ensureSpeciesAssignedToProject(nextProjectId, nextSpeciesId);
      }

      const updatedScan = await prisma.$transaction(async (tx) => {
        const updated = await tx.treeScan.update({
          where: { id },
          data: {
            ...data,
            isCorrected: true,
            correctedBy: changedBy,
          },
          include: TREE_SCAN_INCLUDE,
        });

        await tx.treeScanAudit.create({
          data: {
            treeScanId: id,
            changedBy,
            changeReason: data.correctionReason ?? "Tree scan corrected",
            oldData: existingScan as unknown as Prisma.InputJsonValue,
            newData: updated as unknown as Prisma.InputJsonValue,
          },
        });

        return updated;
      });

      return updatedScan;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Soft delete (archive) a tree scan
  async deleteTreeScan(id: number) {
    try {
      await ensureScanExists(id);

      await prisma.treeScan.update({
        where: { id },
        data: {
          isArchived: true,
        },
      });

      return { message: "Tree scan archived successfully" };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Archive all active scans linked to a FOB ID
  async recycleFob(fobId: string) {
    if (!fobId.trim()) {
      throw new AppError(
        400,
        TREE_SCAN_MESSAGES.FOB_ID_REQUIRED,
        ERROR_CODES.VAL_003,
      );
    }

    try {
      const result = await prisma.treeScan.updateMany({
        where: {
          fobId,
          isArchived: false,
        },
        data: {
          isArchived: true,
        },
      });

      return {
        message: "FOB recycled successfully",
        archivedCount: result.count,
      };
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }
}

export const treeScansService = new TreeScansService();
