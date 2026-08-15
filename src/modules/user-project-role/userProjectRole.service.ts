import { Prisma } from "@prisma/client";
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
		select: {
			id: true,
			name: true,
		},
	});

	if (!role) {
		throw new AppError(404, customError("DATA_001"), "Role not found");
	}

	return role;
};

const ensureUserCanBelongToProject = async (
	userId: number,
	projectId: number,
) => {
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
			organisationId: true,
		},
	});

	if (!membership) {
		throw new AppError(
			403,
			customError("TENANT_002"),
			"User does not belong to an active organisation linked to this project",
		);
	}

	return membership;
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
			projectId: true,
			roleId: true,
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
	async getRoles() {
		return await prisma.userProjectRole.findMany({
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
		});
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

		try {
			return await prisma.userProjectRole.create({
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
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError(
					409,
					customError("DATA_002"),
					"Role is already assigned to this user for this project",
				);
			}

			throw new AppError(500, customError("SYS_002"));
		}
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

		try {
			await prisma.userProjectRole.delete({
				where: {
					userId_projectId_roleId: {
						userId,
						projectId,
						roleId,
					},
				},
			});

			// TODO: Revoke refresh tokens if project access is materially reduced.
			// Authorisation-related functionality will be handled separately.

			return {
				message: "User project role removed successfully",
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			throw new AppError(500, customError("SYS_002"));
		}
	}
}

export const userProjectRoleService = new UserProjectRoleService();
