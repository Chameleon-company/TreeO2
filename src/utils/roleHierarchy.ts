export const ROLE_GRANTS = {
	SYSTEM_ADMIN: [
		"SYSTEM_ADMIN",
		"SUPPORT_ADMIN",
		"READ_ONLY",
		"ORGANISATION_ADMIN",
		"MEMBER",
		"MANAGER",
		"INSPECTOR",
		"FARMER",
	],

	SUPPORT_ADMIN: [],
	READ_ONLY: [],

	ORGANISATION_ADMIN: ["MEMBER", "MANAGER", "INSPECTOR", "FARMER"],

	MEMBER: [],

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
