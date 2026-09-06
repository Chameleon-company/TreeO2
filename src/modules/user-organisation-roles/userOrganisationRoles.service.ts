import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

const ensureUserOrganisationExists = async (userId: number, orgId: number) => {
	const user = await prisma.userOrganisation.findUnique({
		where: {
			userId_organisationId: {
				userId: userId,
				organisationId: orgId,
			},
		},
		select: { userId: true, organisationId: true },
	});

	if (!user) {
		throw new AppError(
			404,
			customError("DATA_001"),
			"User organisation membership not found",
		);
	}
};

const ensureOrganisationRoleExists = async (orgRoleId: number) => {
	const orgRole = await prisma.organisationRole.findUnique({
		where: { id: orgRoleId },
		select: { id: true },
	});

	if (!orgRole) {
		throw new AppError(
			404,
			customError("DATA_001"),
			"Organisation role not found",
		);
	}
};

const getEntry = async (userId: number, orgId: number, orgRoleId: number) => {
	const entry = await prisma.userOrganisationRoles.findUnique({
		where: {
			userId_organisationId_roleId: {
				userId: userId,
				organisationId: orgId,
				roleId: orgRoleId,
			},
		},
		select: {
			userId: true,
			organisationId: true,
			roleId: true,
		},
	});

	if (!entry) {
		throw new AppError(
			404,
			customError("DATA_001"),
			"User organisation role assignment not found",
		);
	}

	return entry;
};

export class UserOrganisationRolesService {
	async addUserOrganisationRole(
		userId: number,
		orgId: number,
		orgRoleId: number,
	) {
		await ensureUserOrganisationExists(userId, orgId);
		await ensureOrganisationRoleExists(orgRoleId);

		// TODO: (T2 2026 API12) handle role heirarchy check
		// TIP: use the utility provided by AUTH12

		// duplicates should be accounted for by the table's composite pk
		const assignment = await prisma.userOrganisationRoles.create({
			data: {
				userId: userId,
				organisationId: orgId,
				roleId: orgRoleId,
			},
		});

		return assignment;
	}

	async removeUserOrganisationRole(
		userId: number,
		orgId: number,
		orgRoleId: number,
	) {
		await getEntry(userId, orgId, orgRoleId);

		// TODO: (T2 2026 API12) handle role heirarchy, AND revoke related refresh token
		// make sure current user can delete the role
		// TIP: use the utility provided by AUTH12, and use the value from getEntry above to check the role that its deleting

		return await prisma.userOrganisationRoles.delete({
			where: {
				userId_organisationId_roleId: {
					userId: userId,
					organisationId: orgId,
					roleId: orgRoleId,
				},
			},
		});
	}
}

export const userOrganisationRolesService = new UserOrganisationRolesService();
