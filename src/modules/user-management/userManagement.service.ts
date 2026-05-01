import { prisma } from "../../lib/prisma";
import { ERROR_CODES } from "../../utils/errorCodes";
import { AppError } from "../../middleware/errorHandler";

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

// ---------- TYPES (FIX for `any`) ----------
type UserWhere = {
  userProjects?: {
    some: {
      projectId: number | { in: number[] };
    };
  };
};

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
    const where: UserWhere = {};

    const parsed = projectId ? Number(projectId) : undefined;

    if (projectId && Number.isNaN(parsed)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid project ID");
    }

    // ADMIN
    if (authUser.role === "ADMIN") {
      if (parsed !== undefined) {
        where.userProjects = { some: { projectId: parsed } };
      }

      return prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { name: "asc" },
      });
    }

    // MANAGER
    if (authUser.role === "MANAGER") {
      const allowed = authUser.projectIds ?? [];

      if (parsed !== undefined) {
        if (!allowed.includes(parsed)) {
          throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
        }

        where.userProjects = { some: { projectId: parsed } };
      } else {
        where.userProjects = {
          some: { projectId: { in: allowed } },
        };
      }

      return prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { name: "asc" },
      });
    }

    throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
  },

  // GET USER BY ID
  getUserById: async (authUser: AuthUser, id: string) => {
    const userId = Number(id);

    if (Number.isNaN(userId)) {
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
      const allowed = user.userProjects?.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }

      return user;
    }

    const selfAccessRoles = ["INSPECTOR", "FARMER"];

    if (selfAccessRoles.includes(authUser.role)) {
      if (authUser.id !== userId) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }

      return user;
    }

    throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
  },

  // CREATE USER
  createUser: async (data: CreateUserInput) => {
    if (!data.name?.trim()) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Name is required");
    }

    if (typeof data.email !== "string") {
      throw new AppError(400, ERROR_CODES.VAL_003, "Email must be a string");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Invalid email format");
    }

    if (!Number.isInteger(data.roleId)) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Invalid roleId");
    }

    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new AppError(400, ERROR_CODES.VAL_003, "Invalid roleId");
    }

    if (data.projectIds?.length === 0) {
      throw new AppError(
        400,
        ERROR_CODES.VAL_003,
        "projectIds cannot be empty",
      );
    }

    if (data.projectIds) {
      const unique = new Set(data.projectIds);

      if (unique.size !== data.projectIds.length) {
        throw new AppError(400, ERROR_CODES.VAL_003, "Duplicate projectIds");
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(409, ERROR_CODES.DATA_002, "Email already exists");
    }

    return prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        roleId: data.roleId,
        userProjects: data.projectIds
          ? {
              create: data.projectIds.map((p) => ({ projectId: p })),
            }
          : undefined,
      },
      select: userSelect,
    });
  },

  // UPDATE USER
  updateUser: async (authUser: AuthUser, id: string, data: UpdateUserInput) => {
    const userId = Number(id);

    if (Number.isNaN(userId)) {
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

    if (authUser.role === "MANAGER") {
      const allowed = existing.userProjects.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_001, "Forbidden");
      }

      const restrictedFields = ["roleId", "accountActive", "canSignIn"];

      const hasRestricted = restrictedFields.some((f) =>
        Object.prototype.hasOwnProperty.call(data, f),
      );

      if (hasRestricted) {
        throw new AppError(
          403,
          ERROR_CODES.AUTH_001,
          "Managers cannot update restricted fields",
        );
      }
    }

    if (data.email !== undefined) {
      if (typeof data.email !== "string") {
        throw new AppError(400, ERROR_CODES.VAL_003, "Email must be a string");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(data.email)) {
        throw new AppError(400, ERROR_CODES.VAL_003, "Invalid email format");
      }

      const duplicate = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });

      if (duplicate) {
        throw new AppError(409, ERROR_CODES.DATA_002, "Email already exists");
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

    if (Number.isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, "Invalid user ID");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.DATA_001, "User not found");
    }

    const linked = await prisma.treeScan.findFirst({
      where: {
        OR: [{ farmerId: userId }, { inspectorId: userId }],
      },
    });

    if (linked) {
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
