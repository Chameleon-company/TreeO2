export const SCAN_BATCHES_MESSAGES = {
  FETCHED: "Scan batches fetched successfully",
  FETCHED_ONE: "Scan batch fetched successfully",
  CREATED: "Scan batch uploaded successfully",
  DELETED: "Scan batch deleted successfully",

  NOT_FOUND: "Scan batch not found",
  INVALID_ID: "Invalid scan batch ID",

  CREATE_FAILED: "Failed to create scan batch",
  DELETE_FAILED: "Failed to delete scan batch",

  INVALID_SCANS_ARRAY: "Scans must be provided as a non-empty array",

  INSPECTOR_REQUIRED: "Inspector ID is required",
  PROJECT_REQUIRED: "Project ID is required",

  INSPECTOR_NOT_FOUND: "Inspector not found",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_INACTIVE: "Project is not active and cannot accept scan uploads",

  INVALID_INSPECTOR_ROLE: "User must have Inspector role",
  INVALID_FARMER_ROLE: "Selected farmer_id must belong to a Farmer user",

  FARMER_NOT_FOUND: "Farmer not found",
  FARMER_NOT_ASSIGNED: "Farmer is not assigned to the selected project",

  SPECIES_NOT_FOUND: "Tree species not found",
  SPECIES_NOT_IN_PROJECT: "Tree species is not assigned to this project",

  INSPECTOR_NOT_ASSIGNED: "Inspector is not assigned to the selected project",

  UNAUTHORIZED_ACCESS: "You do not have permission to access this scan batch",
  ADMIN_DELETE_ONLY: "Only Admin users can delete scan batches",

  INVALID_PLANTED_DATE: "Planted date cannot be in the future",
  INVALID_SCAN_DATE: "Scan timestamp cannot be in the future",
  INVALID_PLANTED_YEAR: "Estimated planted year must be between 1950 and the current year",
  INVALID_PLANTED_MONTH: "Estimated planted month must be between 1 and 12",
  INVALID_MEASUREMENT: "Tree measurement value is outside the allowed range",

  DELETE_BLOCKED_HAS_SCANS:
    "Scan batch cannot be deleted because it has related tree scans",
} as const;

export const SCAN_BATCHES_ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "SCAN_BATCH_NOT_FOUND",
  FORBIDDEN: "SCAN_BATCH_FORBIDDEN",
  CREATE_FAILED: "SCAN_BATCH_CREATE_FAILED",
  DELETE_FAILED: "SCAN_BATCH_DELETE_FAILED",
  DELETE_BLOCKED: "SCAN_BATCH_DELETE_BLOCKED",

  PROJECT_INACTIVE: "PROJECT_INACTIVE",
  INVALID_ROLE: "INVALID_ROLE",
  NOT_ASSIGNED: "NOT_ASSIGNED_TO_PROJECT",
  SPECIES_NOT_IN_PROJECT: "SPECIES_NOT_IN_PROJECT",
  INVALID_DATE: "INVALID_DATE",
  INVALID_MEASUREMENT: "INVALID_MEASUREMENT",
} as const;

export const SCAN_BATCHES_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SCAN_BATCHES_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  INSPECTOR: "Inspector",
  FARMER: "Farmer",
} as const;

export const SCAN_BATCHES_LIMITS = {
  MAX_SCANS_PER_BATCH: 500,

  MIN_PLANTED_YEAR: 1950,

  MAX_HEIGHT_M: 100,
  MAX_DIAMETER_CM: 1000,
  MAX_CIRCUMFERENCE_CM: 4000,

  FOB_ID_MAX_LENGTH: 80,
  DEVICE_ID_MAX_LENGTH: 100,
} as const;