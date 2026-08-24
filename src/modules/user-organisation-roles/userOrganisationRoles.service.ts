import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

const ensureUserExists = async (userId: number) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!user) {
		throw new AppError(404, customError("DATA_001"), "User not found");
	}
};

const ensureOrganisationExists = async (orgId: number) => {
	const org = await prisma.organisation.findUnique({
		where: { id: orgId },
		select: { id: true },
	});

	if(!org){
		throw new AppError(404, customError("DATA_001"), "Organisation not found");
	}
};

export class UserOrganisationRolesService {

	async addUserOrganisationRole(userId: number, orgId: number, roleId: number) {
		try {
			await ensureUserExists(userId);
			await ensureOrganisationExists(orgId);

			const existingAssignment = await prisma.userOrganisationRoles.findUnique({
				where: {
					userId_organisationId_roleId: {
						userId: userId,
						organisationId: orgId,
						roleId: roleId
					},
				},
			});
			
			if (existingAssignment) {
				throw new AppError(409, customError("DATA_002"));
			}

			return await prisma.userOrganisationRoles.create({
				data: {
					userId: userId,
					organisationId: orgId,
					roleId: roleId
				}
			});

		} catch(error) {
			if (error instanceof AppError) {
				throw error;
			}

			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError(409, customError("DATA_002"));
			}
			throw new AppError(500, customError("SYS_002"));
		}
	}

	async removeUserOrganisationRole(userId: number, orgId: number, roleId: number) {
		try {
			await ensureUserExists(userId);
			await ensureOrganisationExists(orgId);

			return await prisma.userOrganisationRoles.delete({
				where: {
					userId_organisationId_roleId: {
						userId: userId,
						organisationId: orgId,
						roleId
					}
				},
			})

		} catch(error) {
			if (error instanceof AppError) {
				throw error;
			}

			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError(409, customError("DATA_002"));
			}
			throw new AppError(500, customError("SYS_002"));
		}
	}
}

export const userOrganisationRolesService = new UserOrganisationRolesService();