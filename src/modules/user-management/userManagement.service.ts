import { prisma } from "../../lib/prisma";
import { ERROR_CODES } from "../../utils/errorCodes";

// ---------- TYPES ----------
export type AuthUser = {
  id: number;
  role: string;
  projectIds?: number[];
};

export type CreateUserInput = {
  name: string;
  email: string;
  roleId: number;
  projectIds?: number[];
};

type UpdateUserInput = Partial<CreateUserInput>;

// ---------- ERROR HELPER ----------
class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---------- SELECT ----------
const userSelect = {
  id: true,
  name: true,
  email: true,
  accountActive: true,
  canSignIn: true,
  primaryRole: true,
  roleAssignments: { include: { role: true } },
  userProjects: { include: { project: true } },
};

// ---------- SERVICE ----------
export const UserManagementService = {

  // GET USERS
  getUsers: async (authUser: AuthUser, projectId?: string) => {
    const where: Record<string, unknown> = {};

    const parsed = projectId ? Number(projectId) : null;

    if (projectId && isNaN(parsed as number)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid project ID");
    }

    const managerFilter =
      authUser.role === "MANAGER"
        ? { projectId: { in: authUser.projectIds ?? [] } }
        : {};

    where["userProjects"] = {
      some: {
        AND: [
          managerFilter,
          parsed ? { projectId: parsed } : {},
        ],
      },
    };

    return prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { name: "asc" },
    });
  },

  // GET USER BY ID
  getUserById: async (authUser: AuthUser, id: string) => {
    const userId = Number(id);

    if (isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid user ID");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.DATA_001, "User not found");
    }

    if (authUser.role === "ADMIN") {
      return user;
    }

    if (authUser.role === "MANAGER") {
      const allowed = user.userProjects.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }
    }

    if (["INSPECTOR", "FARMER"].includes(authUser.role)) {
      if (authUser.id !== userId) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }
    }

    return user;
  },

  // CREATE USER
  createUser: async (data: CreateUserInput) => {
    if (!data.name?.trim()) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Name is required");
    }

    if (!data.email?.trim()) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Email is required");
    }

    if (!data.roleId) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Role ID is required");
    }

    return prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        roleId: data.roleId,
        userProjects: data.projectIds
          ? {
              create: data.projectIds.map((p: number) => ({
                projectId: p,
              })),
            }
          : undefined,
      },
      select: userSelect,
    });
  },

  // UPDATE USER
  updateUser: async (
    authUser: AuthUser,
    id: string,
    data: UpdateUserInput,
  ) => {
    const userId = Number(id);

    if (isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid user ID");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Empty update payload");
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { userProjects: true },
    });

    if (!existing) {
      throw new AppError(404, ERROR_CODES.DATA_001, "User not found");
    }

    if (authUser.role !== "ADMIN") {
      if (authUser.role !== "MANAGER") {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }

      const allowed = existing.userProjects.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
  },

  // DELETE USER
  deleteUser: async (id: string) => {
    const userId = Number(id);

    if (isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid user ID");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.DATA_001, "User not found");
    }

    const linkedScan = await prisma.treeScan.findFirst({
      where: {
        OR: [{ farmerId: userId }, { inspectorId: userId }],
      },
    });

    if (linkedScan) {
      throw new AppError(
        409,
        ERROR_CODES.VAL_001,
        "User linked to scan records",
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        accountActive: false,
        canSignIn: false,
      },
    });

    return true;
  },
};