import { Prisma } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import type {
  CreateProjectTreeTypeInput,
  ListProjectTreeTypesQuery,
} from "./projectTreeTypes.schemas";

interface ProjectTreeTypeResponse {
  project_id: number;
  tree_type_id: number;
  project: {
    id: number;
    name: string;
  };
  tree_type: {
    id: number;
    name: string;
    key: string | null;
    scientific_name: string | null;
    dry_weight_density: number;
  };
}

const PROJECT_NOT_FOUND_MESSAGE = "Project not found";
const TREE_TYPE_NOT_FOUND_MESSAGE = "Tree type not found";
const PROJECT_TREE_TYPE_NOT_FOUND_MESSAGE =
  "Project tree type mapping not found";
const PROJECT_TREE_TYPE_DUPLICATE_MESSAGE =
  "This tree type is already assigned to the project";

export class ProjectTreeTypesService {
  async listProjectTreeTypes(
    query: ListProjectTreeTypesQuery,
  ): Promise<ProjectTreeTypeResponse[]> {
    const mappings = await prisma.projectTreeType.findMany({
      where: query.project_id
        ? {
            projectId: query.project_id,
          }
        : undefined,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        treeType: {
          select: {
            id: true,
            name: true,
            key: true,
            scientificName: true,
            dryWeightDensity: true,
          },
        },
      },
      orderBy: [{ projectId: "asc" }, { treeTypeId: "asc" }],
    });

    return mappings.map((mapping) => this.toResponse(mapping));
  }

  async addProjectTreeType(
    payload: CreateProjectTreeTypeInput,
  ): Promise<ProjectTreeTypeResponse> {
    const [project, treeType] = await Promise.all([
      prisma.project.findUnique({
        where: { id: payload.project_id },
        select: { id: true, name: true },
      }),
      prisma.treeType.findUnique({
        where: { id: payload.tree_type_id },
        select: {
          id: true,
          name: true,
          key: true,
          scientificName: true,
          dryWeightDensity: true,
        },
      }),
    ]);

    if (!project) {
      throw new AppError(404, PROJECT_NOT_FOUND_MESSAGE, "DATA_001");
    }

    if (!treeType) {
      throw new AppError(404, TREE_TYPE_NOT_FOUND_MESSAGE, "DATA_001");
    }

    const existingMapping = await prisma.projectTreeType.findUnique({
      where: {
        projectId_treeTypeId: {
          projectId: payload.project_id,
          treeTypeId: payload.tree_type_id,
        },
      },
    });

    if (existingMapping) {
      throw new AppError(409, PROJECT_TREE_TYPE_DUPLICATE_MESSAGE, "DATA_002");
    }

    try {
      const mapping = await prisma.projectTreeType.create({
        data: {
          projectId: payload.project_id,
          treeTypeId: payload.tree_type_id,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          treeType: {
            select: {
              id: true,
              name: true,
              key: true,
              scientificName: true,
              dryWeightDensity: true,
            },
          },
        },
      });

      logger.info("Tree type assigned to project", {
        projectId: payload.project_id,
        treeTypeId: payload.tree_type_id,
      });

      return this.toResponse(mapping);
    } catch (error) {
      this.throwPersistenceConflict(error);
    }
  }

  async removeProjectTreeType(
    projectId: number,
    treeTypeId: number,
  ): Promise<void> {
    const existingMapping = await prisma.projectTreeType.findUnique({
      where: {
        projectId_treeTypeId: {
          projectId,
          treeTypeId,
        },
      },
    });

    if (!existingMapping) {
      throw new AppError(404, PROJECT_TREE_TYPE_NOT_FOUND_MESSAGE, "DATA_001");
    }

    await prisma.projectTreeType.delete({
      where: {
        projectId_treeTypeId: {
          projectId,
          treeTypeId,
        },
      },
    });

    logger.info("Tree type removed from project", {
      projectId,
      treeTypeId,
    });
  }

  private throwPersistenceConflict(error: unknown): never {
    if (error instanceof AppError) {
      throw error;
    }

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(
          409,
          PROJECT_TREE_TYPE_DUPLICATE_MESSAGE,
          "DATA_002",
        );
      }
    }

    if (errorCode === "P2002" || errorCode === "23505") {
      throw new AppError(409, PROJECT_TREE_TYPE_DUPLICATE_MESSAGE, "DATA_002");
    }

    throw error;
  }

  private toResponse(mapping: {
    projectId: number;
    treeTypeId: number;
    project: {
      id: number;
      name: string;
    };
    treeType: {
      id: number;
      name: string;
      key: string | null;
      scientificName: string | null;
      dryWeightDensity: unknown;
    };
  }): ProjectTreeTypeResponse {
    return {
      project_id: mapping.projectId,
      tree_type_id: mapping.treeTypeId,
      project: {
        id: mapping.project.id,
        name: mapping.project.name,
      },
      tree_type: {
        id: mapping.treeType.id,
        name: mapping.treeType.name,
        key: mapping.treeType.key,
        scientific_name: mapping.treeType.scientificName,
        dry_weight_density: Number(mapping.treeType.dryWeightDensity),
      },
    };
  }
}
