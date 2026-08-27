export const ROLE_GRANTS = {
	SYSTEM_ADMIN: [
		"SYSTEM_ADMIN",
		"ORGANISATION_ADMIN",
		"MANAGER",
		"INSPECTOR",
		"FARMER",
	],
	ORGANISATION_ADMIN: ["MANAGER", "INSPECTOR", "FARMER"],
	MANAGER: ["INSPECTOR", "FARMER"],
	INSPECTOR: [],
	FARMER: [],
} as const;

export type HierarchyRoleName = keyof typeof ROLE_GRANTS;

export const canGrantRole = (
	actorRole: HierarchyRoleName,
	targetRole: HierarchyRoleName,
): boolean => {
	return (ROLE_GRANTS[actorRole] as readonly HierarchyRoleName[]).includes(
		targetRole,
	);
};
