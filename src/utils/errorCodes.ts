export const ERROR_CODES = {
	// Authentication
	AUTH_001: "Invalid credentials",
	AUTH_002: "Token expired",
	AUTH_003: "Authentication required",
	AUTH_004: "Insufficient permissions",
	AUTH_005: "Invalid token",
	AUTH_006: "Auth feature not implemented",
	AUTH_007: "Project scope required",
	AUTH_008: "Invalid token scope",
	AUTH_009: "Refresh token revoked",

	// Tenant
	TENANT_001: "Organisation access denied",
	TENANT_002: "Project not linked to organisation",

	// Validation
	VAL_001: "Validation failed",
	VAL_002: "Invalid request body",
	VAL_003: "Missing required fields",
	VAL_004: "Invalid email format",
	VAL_005: "Date in future",
	VAL_006: "Invalid measurement",
	VAL_007: "Invalid coordinates",

	// Data
	DATA_001: "Resource not found",
	DATA_002: "Duplicate entry",
	DATA_003: "Record is referenced by other records",
	DATA_004: "Dependent records prevent deletion",
	DATA_005: "Record is archived",

	// System
	SYS_001: "Internal server error",
	SYS_002: "Database error",
	SYS_003: "Service unavailable",
	SYS_004: "Report generation failed",
	SYS_005: "External service error",

	// Farm
	FARM_001: "Farm not found or not accessible in selected project",
	FARM_002: "Farmer could not be resolved for farm upload",
	FARM_003: "Duplicate farm code for farmer/project",

	// Geo
	GEO_001: "Required GeoPackage layer missing",
	GEO_002: "Invalid, empty, or unsupported boundary geometry",
	GEO_003: "Eligible boundary is not associated with the primary farm boundary",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type CustomError = {
	[Code in ErrorCode]: {
		code: Code;
		message: (typeof ERROR_CODES)[Code];
	};
}[ErrorCode];

export function customError<Code extends ErrorCode>(
	code: Code,
): { code: Code; message: (typeof ERROR_CODES)[Code] } {
	return {
		code: code,
		message: ERROR_CODES[code],
	};
}
