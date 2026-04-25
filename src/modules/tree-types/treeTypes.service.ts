import { Prisma } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import type {
  CreateTreeTypeInput,
  UpdateTreeTypeInput,
} from "./treeTypes.schemas";

interface TreeTypeResponse {
  id: number;
  name: string;
  key: string | null;
  scientific_name: string | null;
  dry_weight_density: number;
  created_at: string;
  updated_at: string;
}

const TREE_TYPE_NOT_FOUND_MESSAGE = "Tree type not found";
const TREE_TYPE_DUPLICATE_KEY_MESSAGE = "Tree type key already exists";
const TREE_TYPE_DELETE_REFERENCED_MESSAGE =
  "Tree type cannot be deleted because it is referenced by other records";

export class TreeTypesService {
  async listTreeTypes(): Promise<TreeTypeResponse[]> {
    const treeTypes = await prisma.treeType.findMany({
      orderBy: { name: "asc" },
    });

    return treeTypes.map((treeType) => this.toResponse(treeType));
  }

  async getTreeTypeById(id: number): Promise<TreeTypeResponse> {
    const treeType = await prisma.treeType.findUnique({ where: { id } });

    if (!treeType) {
      throw new AppError(404, TREE_TYPE_NOT_FOUND_MESSAGE, "DATA_001");
    }

    return this.toResponse(treeType);
  }

  async createTreeType(
    payload: CreateTreeTypeInput,
  ): Promise<TreeTypeResponse> {
    await this.ensureUniqueKey(payload.key);

    try {
      const treeType = await prisma.treeType.create({
        data: {
          name: payload.name,
          key: payload.key,
          scientificName: payload.scientific_name,
          dryWeightDensity: payload.dry_weight_density ?? 595,
        },
      });

      logger.info("Tree type created", {
        treeTypeId: treeType.id,
        key: treeType.key,
        name: treeType.name,
      });

      return this.toResponse(treeType);
    } catch (error) {
      this.throwPersistenceConflict(
        error,
        TREE_TYPE_DUPLICATE_KEY_MESSAGE,
        TREE_TYPE_DELETE_REFERENCED_MESSAGE,
      );
    }
  }

  async updateTreeType(
    id: number,
    payload: UpdateTreeTypeInput,
  ): Promise<TreeTypeResponse> {
    const existingTreeType = await prisma.treeType.findUnique({
      where: { id },
    });

    if (!existingTreeType) {
      throw new AppError(404, TREE_TYPE_NOT_FOUND_MESSAGE, "DATA_001");
    }

    if (payload.key) {
      await this.ensureUniqueKey(payload.key, id);
    }

    try {
      const treeType = await prisma.treeType.update({
        where: { id },
        data: {
          name: payload.name,
          key: payload.key,
          scientificName: payload.scientific_name,
          dryWeightDensity: payload.dry_weight_density,
        },
      });

      logger.info("Tree type updated", {
        treeTypeId: treeType.id,
        key: treeType.key,
        name: treeType.name,
      });

      return this.toResponse(treeType);
    } catch (error) {
      this.throwPersistenceConflict(
        error,
        TREE_TYPE_DUPLICATE_KEY_MESSAGE,
        TREE_TYPE_DELETE_REFERENCED_MESSAGE,
      );
    }
  }

  async deleteTreeType(id: number): Promise<void> {
    try {
      const deletedTreeType = await prisma.$transaction(async (tx) => {
        const existingTreeType = await tx.treeType.findUnique({
          where: { id },
        });

        if (!existingTreeType) {
          throw new AppError(404, TREE_TYPE_NOT_FOUND_MESSAGE, "DATA_001");
        }

        const [projectTreeTypeReferences, treeScanReferences] =
          await Promise.all([
            tx.projectTreeType.count({ where: { treeTypeId: id } }),
            tx.treeScan.count({ where: { speciesId: id } }),
          ]);

        if (projectTreeTypeReferences > 0 || treeScanReferences > 0) {
          throw new AppError(
            409,
            TREE_TYPE_DELETE_REFERENCED_MESSAGE,
            "DATA_002",
          );
        }

        await tx.treeType.delete({ where: { id } });
        return existingTreeType;
      });

      logger.info("Tree type deleted", {
        treeTypeId: id,
        key: deletedTreeType.key,
        name: deletedTreeType.name,
      });
    } catch (error) {
      this.throwPersistenceConflict(
        error,
        TREE_TYPE_DUPLICATE_KEY_MESSAGE,
        TREE_TYPE_DELETE_REFERENCED_MESSAGE,
      );
    }
  }

  private async ensureUniqueKey(
    key: string | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (!key) {
      return;
    }

    const existingTreeType = await prisma.treeType.findFirst({
      where: {
        key,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existingTreeType) {
      throw new AppError(409, TREE_TYPE_DUPLICATE_KEY_MESSAGE, "DATA_002");
    }
  }

  private throwPersistenceConflict(
    error: unknown,
    duplicateKeyMessage: string,
    foreignKeyMessage: string,
  ): never {
    if (error instanceof AppError) {
      throw error;
    }

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(409, duplicateKeyMessage, "DATA_002");
      }

      if (error.code === "P2003") {
        throw new AppError(409, foreignKeyMessage, "DATA_002");
      }
    }

    if (errorCode === "P2002" || errorCode === "23505") {
      throw new AppError(409, duplicateKeyMessage, "DATA_002");
    }

    if (errorCode === "P2003" || errorCode === "23503") {
      throw new AppError(409, foreignKeyMessage, "DATA_002");
    }

    throw error;
  }

  private toResponse(treeType: {
    id: number;
    name: string;
    key: string | null;
    scientificName: string | null;
    dryWeightDensity: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): TreeTypeResponse {
    return {
      id: treeType.id,
      name: treeType.name,
      key: treeType.key,
      scientific_name: treeType.scientificName,
      dry_weight_density: Number(treeType.dryWeightDensity),
      created_at: treeType.createdAt.toISOString(),
      updated_at: treeType.updatedAt.toISOString(),
    };
  }
}
