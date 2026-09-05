import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

export type AssignUserProjectRoleInput = {
	userId: number;
	projectId: number;
	roleId: number;
	assignedBy: number;
};

const ensureUserExists = async (userId: number) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!user) {
		throw new AppError(404, customError("DATA_001"), "User not found");
	}
};

const ensureProjectExists = async (projectId: number) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	});

	if (!project) {
		throw new AppError(404, customError("DATA_001"), "Project not found");
	}
};

const ensureRoleExists = async (roleId: number) => {
	const role = await prisma.role.findUnique({
		where: { id: roleId },
		select: { id: true },
	});

	if (!role) {
		throw new AppError(404, customError("DATA_001"), "Role not found");
	}
};

const ensureUserCanBelongToProject = async (
	userId: number,
	projectId: number,
) => {
	// Confirms the target user belongs to an active organisation
	// that has access to the selected project.
	const membership = await prisma.userOrganisation.findFirst({
		where: {
			userId,
			status: "active",
			organisation: {
				accountActive: true,
				projectOrganisation: {
					some: {
						projectId,
					},
				},
			},
		},
		select: {
			userId: true,
		},
	});

	if (!membership) {
		throw new AppError(
			403,
			customError("TENANT_002"),
			"User does not belong to an active organisation linked to this project",
		);
	}
};

const ensureRoleNotAlreadyAssigned = async (
	userId: number,
	projectId: number,
	roleId: number,
) => {
	const existingAssignment = await prisma.userProjectRole.findUnique({
		where: {
			userId_projectId_roleId: {
				userId,
				projectId,
				roleId,
			},
		},
		select: {
			userId: true,
		},
	});

	if (existingAssignment) {
		throw new AppError(
			409,
			customError("DATA_002"),
			"Role is already assigned to this user for this project",
		);
	}
};

export class UserProjectRoleService {
	async getRoles(page = 1, limit = 10) {
		const skip = (page - 1) * limit;

		const [data, total] = await Promise.all([
			prisma.userProjectRole.findMany({
				skip,
				take: limit,
				include: {
					user: {
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
					role: {
						select: {
							id: true,
							name: true,
						},
					},
					assignedByUser: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.userProjectRole.count(),
		]);

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async assignRole(data: AssignUserProjectRoleInput) {
		await ensureUserExists(data.userId);
		await ensureProjectExists(data.projectId);
		await ensureRoleExists(data.roleId);
		await ensureUserCanBelongToProject(data.userId, data.projectId);
		await ensureRoleNotAlreadyAssigned(
			data.userId,
			data.projectId,
			data.roleId,
		);

		return prisma.userProjectRole.create({
			data: {
				userId: data.userId,
				projectId: data.projectId,
				roleId: data.roleId,
				assignedBy: data.assignedBy,
			},
			include: {
				user: {
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
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async removeRole(userId: number, projectId: number, roleId: number) {
		const existingAssignment = await prisma.userProjectRole.findUnique({
			where: {
				userId_projectId_roleId: {
					userId,
					projectId,
					roleId,
				},
			},
		});

		if (!existingAssignment) {
			throw new AppError(
				404,
				customError("DATA_001"),
				"User project role assignment not found",
			);
		}

		await prisma.userProjectRole.delete({
			where: {
				userId_projectId_roleId: {
					userId,
					projectId,
					roleId,
				},
			},
		});

		return {
			message: "User project role removed successfully",
		};
	}
}

export const userProjectRoleService = new UserProjectRoleService();
