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

export class UserOrganisationsService {

	async getUserOrganisations() {
		try {
			return await prisma.userOrganisation.findMany({
				where: { },
			});
		} catch {
			throw new AppError(500, customError("SYS_002"));
		}
	}

	async addUserToOrganisation(userId: number, orgId: number) {
		try {
			await ensureUserExists(userId);
			await ensureOrganisationExists(orgId);

			const existingAssignment = await prisma.userOrganisation.findUnique({
				where: {
					userId_organisationId: {
						userId: userId,
						organisationId: orgId,
					},
				},
			});
			
			if (existingAssignment) {
				throw new AppError(409, customError("DATA_002"));
			}

			return await prisma.userOrganisation.create({
				data: {
					userId: userId,
					organisationId: orgId,
					status: "invited"
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

	async updateUserMembershipStatus(userId: number, orgId: number, newStatus: string) {
		try {
			await ensureUserExists(userId);
			await ensureOrganisationExists(orgId);

			return await prisma.userOrganisation.update({
				where: {
					userId_organisationId : {
						userId: userId,
						organisationId: orgId
					}
				},
				data: {
					status: newStatus
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

	async removeUserMembershipStatus(userId: number, orgId: number) {
		try {
			await ensureUserExists(userId);
			await ensureOrganisationExists(orgId);

			return await prisma.userOrganisation.delete({
				where: {
					userId_organisationId : {
						userId: userId,
						organisationId: orgId
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

export const userOrganisationsService = new UserOrganisationsService();