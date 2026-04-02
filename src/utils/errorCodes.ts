export const ERROR_CODES = {
  // Authentication
  AUTH_001: "AUTH_001: Invalid credentials",
  AUTH_002: "AUTH_002: Token expired",
  AUTH_003: "AUTH_003: Authentication required",
  AUTH_004: "AUTH_004: Insufficient permissions",
  AUTH_005: "AUTH_005: Invalid token",
  AUTH_006: "AUTH_006: Auth feature not implemented",
  AUTH_007: "AUTH_007: Project scope required",

  // Validation
  VAL_001: "VAL_001: Validation failed",
  VAL_002: "VAL_002: Invalid request body",
  VAL_003: "VAL_003: Missing required fields",

  // Data
  DATA_001: "DATA_001: Resource not found",
  DATA_002: "DATA_002: Duplicate entry",

  // System
  SYS_001: "SYS_001: Internal server error",
  SYS_002: "SYS_002: Database error",
  SYS_003: "SYS_003: Service unavailable",
} as const;
