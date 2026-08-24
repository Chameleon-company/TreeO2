import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { customError } from "../utils/errorCodes";

/**
 * [TECH DEBT / VELOCITY STUB]
 * Specification v1.3 Section 6.4 Example Capability Matrix
 *
 * INCOMPLETE: This is currently a hardcoded dictionary used as a stub to unblock the API streams.
 * WHY: The Security stream is blocked waiting for the Database stream to merge the granular permissions schema
 *      and build the database seeders for the 'permissions' and 'role_permissions' tables.
 * WHEN TO UPDATE: Once the DB stream merges the permission registries, this hardcoded dictionary
 *                 MUST be swapped out for a dynamic Prisma database query to fully meet the PO's requirement.
 */
const ROLE_CAPABILITIES: Record<string, readonly string[]> = {
	Manager: [
		"projects:read",
		"projects:update",
		"project_organisations:read",
		"project_organisations:create",
		"project_organisations:update",
		"project_organisations:delete",
		"users:create",
		"users:read",
		"users:update",
		"user_organisations:read",
		"user_organisations:create",
		"user_organisations:update",
		"user_organisations:delete",
		"user_organisation_roles:assign",
		"user_organisation_roles:remove",
		"user_project_roles:assign",
		"tree_types:read",
		"tree_scans:create",
		"tree_scans:read",
		"tree_scans:correct",
		"tree_scans:archive",
		"scan_batches:create",
		"reports:create",
		"reports:read",
		"dashboard:read",
		"farms:create",
		"farms:read",
		"farms:update",
		"farms:archive",
		"farm_boundaries:read",
		"farm_boundaries:upload",
	],
	Inspector: [
		"projects:read",
		"users:read",
		"users:update",
		"tree_types:read",
		"tree_scans:create",
		"tree_scans:read",
		"scan_batches:create",
		"dashboard:read",
		"farms:read",
		"farm_boundaries:read",
	],
	Farmer: [
		"projects:read",
		"users:read",
		"users:update",
		"tree_types:read",
		"tree_scans:read",
		"dashboard:read",
		"farms:read",
		"farm_boundaries:read",
	],
} as const;

/**
 * Temporary Legacy Role Fallback Matrix (To be decommissioned in AUTH-CLEANUP)
 *
 * WHY THIS IS REQUIRED:
 * We are actively migrating to the v1.3 Authentication Spec, which uses an array of 'projectRoles'.
 * However, older JWT tokens and legacy API integration tests still rely on a flat string 'role' (e.g. role: "ADMIN").
 * This fallback matrix acts as a translation bridge so that legacy tokens don't suddenly return 403 Forbidden
 * on all endpoints, keeping the application stable while the API stream finishes their migration.
 *
 * HOW TO REMOVE:
 * Once the test and environment variables are fully updated and frontend clients generate v1.3 compliant JWT tokens
 * (with 'projectRoles', 'systemRole', and 'organisationRole'), this entire object and its corresponding fallback
 * logic at the bottom of the requirePermission function MUST be deleted.
 */
const LEGACY_ROLE_CAPABILITIES: Record<string, readonly string[]> = {
	ADMIN: [
		"projects:create",
		"projects:read",
		"projects:update",
		"projects:delete",
		"project_organisations:read",
		"project_organisations:create",
		"project_organisations:update",
		"project_organisations:delete",
		"users:create",
		"users:read",
		"users:update",
		"user_organisations:read",
		"user_organisations:create",
		"user_organisations:update",
		"user_organisations:delete",
		"user_organisation_roles:assign",
		"user_organisation_roles:remove",
		"user_project_roles:assign",
		"tree_types:create",
		"tree_types:read",
		"tree_types:update",
		"tree_scans:create",
		"tree_scans:read",
		"tree_scans:correct",
		"tree_scans:archive",
		"scan_batches:create",
		"reports:create",
		"reports:read",
		"dashboard:read",
		"farms:create",
		"farms:read",
		"farms:update",
		"farms:archive",
		"farm_boundaries:read",
		"farm_boundaries:upload",
	],
	DEVELOPER: ["tree_scans:read", "localization:read", "localization:update"],
} as const;

/**
 * Higher-order middleware factory requiring fine-grained capability permission keys.
 * Implements Specification v1.3 Section 6 & AUTH04 override rules.
 *
 * @param permissionKey - Specification v1.3 Section 6.4 capability permission key (e.g., 'tree_scans:create')
 * @returns Express middleware function
 */
export const requirePermission = (permissionKey: string) => {
	return (req: Request, _res: Response, next: NextFunction): void => {
		// 1. Ensure user is authenticated via authMiddleware
		if (!req.user) {
			next(new AppError(401, customError("AUTH_003")));
			return;
		}

		// 2. AUTH04 Rule 1: SystemAdmin Unrestricted Override (Section 6.1)
		if (req.user.systemRole === "SystemAdmin") {
			next();
			return;
		}

		// 3. AUTH04 Rule 2: OrganisationAdmin Implicit Access Override (Section 6.2)
		if (
			req.user.scope === "project" &&
			"organisationRole" in req.user &&
			req.user.organisationRole === "OrganisationAdmin"
		) {
			next();
			return;
		}

		// 4. AUTH03: Fine-grained Capability Verification across req.user.projectRoles (Section 6.4)
		const projectRoles =
			req.user.scope === "project" && "projectRoles" in req.user
				? req.user.projectRoles
				: [];
		let hasCapability = false;

		for (const roleName of projectRoles) {
			if (ROLE_CAPABILITIES[roleName]?.includes(permissionKey)) {
				hasCapability = true;
				break;
			}
		}

		// 5. Temporary Legacy Role Fallback
		// [AUTH-CLEANUP] HOW TO REMOVE:
		// Once the test and environment variables are fully updated and frontend clients generate
		// v1.3 compliant JWT tokens, this entire 'if' block must be deleted along with the
		// LEGACY_ROLE_CAPABILITIES dictionary above.
		if (!hasCapability && req.user.role) {
			const normalizedRole = req.user.role.toUpperCase();
			const legacyCapabilities =
				LEGACY_ROLE_CAPABILITIES[normalizedRole] ||
				ROLE_CAPABILITIES[req.user.role];

			if (legacyCapabilities?.includes(permissionKey)) {
				hasCapability = true;
			}
		}

		if (!hasCapability) {
			next(new AppError(403, customError("AUTH_004")));
			return;
		}

		next();
	};
};
