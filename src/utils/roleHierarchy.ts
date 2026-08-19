export const ROLE_HIERARCHY= [
    "FARMER", 
    "INSPECTOR",
    "MANAGER",
    "ORGANISATION_ADMIN",
    "SYSTEM_ADMIN",
] as const;

export type HirarchyRoleName = (typeof ROLE_HIERARCHY)[number];

export const canGrantRole = (
    actorRole: HirarchyRoleName ,
    targetRole: HirarchyRoleName
) : boolean => {
    const actorIndex = ROLE_HIERARCHY.indexOf(actorRole);
    const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);

    return actorIndex > targetIndex;
};