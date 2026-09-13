import { UserOrganisation, type Status } from "@prisma/client";
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

	if (!org) {
		throw new AppError(404, customError("DATA_001"), "Organisation not found");
	}
};

const ensureEntryExists = async (userId: number, orgId: number) => {
	const entry = await prisma.userOrganisation.findUnique({
		where: {
			userId_organisationId: {
				userId: userId,
				organisationId: orgId,
			},
		},
		select: { userId: true, organisationId: true },
	});

	if (!entry) {
		throw new AppError(
			404,
			customError("DATA_001"),
			"User organisation membership not found",
		);
	}
};

type PaginatedUserOrganisation = {
	data: UserOrganisation[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export class UserOrganisationsService {
	async listUserOrganisations(
		page: number,
		limit: number,
	): Promise<PaginatedUserOrganisation> {
		const skip = (page - 1) * limit;
		const [userOrganisations, total] = await Promise.all([
			prisma.userOrganisation.findMany({
				skip: skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.userOrganisation.count(),
		]);

		return {
			data: userOrganisations,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async addUserOrganisation(userId: number, orgId: number, status: Status) {
		await ensureUserExists(userId);
		await ensureOrganisationExists(orgId);

		// TODO: (T2 2026 API12) OrganisationAdmin may invite users to their own organisation

		return await prisma.userOrganisation.create({
			data: {
				userId: userId,
				organisationId: orgId,
				status: status,
			},
		});
	}

	async updateUserOrganisation(
		userId: number,
		orgId: number,
		newStatus: Status,
	) {
		await ensureEntryExists(userId, orgId);
		// TODO: (T2 2026 API12) OrganisationAdmin may invite users to their own organisation

		return await prisma.userOrganisation.update({
			where: {
				userId_organisationId: {
					userId: userId,
					organisationId: orgId,
				},
			},
			data: {
				status: newStatus,
			},
		});
	}

	async deleteUserOrganisation(userId: number, orgId: number) {
		await ensureEntryExists(userId, orgId);

		// TODO: (T2 2026 API12) check if acting user can delete target user
		// use AUTH12's role hierarchy utility
		// find all existing rows in user_organisation_roles

		return await prisma.$transaction(async (tx) => {
			await tx.userOrganisationRoles.deleteMany({
				where: {
					userId: userId,
					organisationId: orgId,
				},
			});

			//  TODO: (T2 2026 API12) revoke refresh tokens

			return await tx.userOrganisation.delete({
				where: {
					userId_organisationId: {
						userId: userId,
						organisationId: orgId,
					},
				},
			});
		});
	}
}

export const userOrganisationsService = new UserOrganisationsService();
