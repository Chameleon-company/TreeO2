export const ERROR_CODES = {
  // Authentication
  AUTH_001: "AUTH_001: Invalid credentials",
  AUTH_002: "AUTH_002: Token expired",

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
