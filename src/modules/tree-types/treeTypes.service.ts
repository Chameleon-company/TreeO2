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
      throw new AppError(404, "Tree type not found", "DATA_001");
    }

    return this.toResponse(treeType);
  }

  async createTreeType(
    payload: CreateTreeTypeInput,
  ): Promise<TreeTypeResponse> {
    await this.ensureUniqueKey(payload.key);

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
  }

  async updateTreeType(
    id: number,
    payload: UpdateTreeTypeInput,
  ): Promise<TreeTypeResponse> {
    const existingTreeType = await prisma.treeType.findUnique({
      where: { id },
    });

    if (!existingTreeType) {
      throw new AppError(404, "Tree type not found", "DATA_001");
    }

    if (payload.key) {
      await this.ensureUniqueKey(payload.key, id);
    }

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
  }

  async deleteTreeType(id: number): Promise<void> {
    const existingTreeType = await prisma.treeType.findUnique({
      where: { id },
    });

    if (!existingTreeType) {
      throw new AppError(404, "Tree type not found", "DATA_001");
    }

    const [projectTreeTypeReferences, treeScanReferences] = await Promise.all([
      prisma.projectTreeType.count({ where: { treeTypeId: id } }),
      prisma.treeScan.count({ where: { speciesId: id } }),
    ]);

    if (projectTreeTypeReferences > 0 || treeScanReferences > 0) {
      throw new AppError(
        409,
        "Tree type cannot be deleted because it is referenced by other records",
        "DATA_002",
      );
    }

    await prisma.treeType.delete({ where: { id } });

    logger.info("Tree type deleted", {
      treeTypeId: id,
      key: existingTreeType.key,
      name: existingTreeType.name,
    });
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
      throw new AppError(409, "Tree type key already exists", "DATA_002");
    }
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
