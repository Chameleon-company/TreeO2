export const TREE_SCAN_LIMITS = {
  MIN_PLANTED_YEAR: 1950,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const TREE_SCAN_MESSAGES = {
  SCAN_NOT_FOUND: "Tree scan not found",
  PROJECT_NOT_FOUND: "Project not found",
  PROJECT_INACTIVE: "Project is inactive",
  FARMER_NOT_FOUND: "Farmer not found",
  INSPECTOR_NOT_FOUND: "Inspector not found",
  SPECIES_NOT_FOUND: "Tree type not found",
  INSPECTOR_NOT_ASSIGNED: "Inspector is not assigned to this project",
  FARMER_NOT_ASSIGNED: "Farmer is not assigned to this project",
  SPECIES_NOT_ASSIGNED: "Tree type is not assigned to this project",
  INVALID_PLANTED_YEAR: "Invalid estimated planted year",
  INVALID_PLANTED_MONTH: "Invalid estimated planted month",
  INVALID_COORDINATES: "Invalid coordinates",
  CORRECTION_REASON_REQUIRED:
    "Correction reason is required when correcting scan data",
  FOB_ID_REQUIRED: "FOB ID is required",
} as const;

export const TREE_SCAN_INCLUDE = {
  project: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  farmer: {
    select: {
      id: true,
      name: true,
      email: true,
      cardId: true,
      accountActive: true,
    },
  },
  inspector: {
    select: {
      id: true,
      name: true,
      email: true,
      accountActive: true,
    },
  },
  species: {
    select: {
      id: true,
      name: true,
      key: true,
      scientificName: true,
      dryWeightDensity: true,
    },
  },
  batch: {
    select: {
      id: true,
      uploadedAt: true,
    },
  },
  correctedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;
