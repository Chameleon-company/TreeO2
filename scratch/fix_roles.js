const fs = require('fs');
let content = fs.readFileSync('src/middleware/capability.middleware.ts', 'utf8');

// 1. Add Developer to ROLE_CAPABILITIES (which ends before the JSDoc for LEGACY_ROLE_CAPABILITIES)
// We look for the closing brace of ROLE_CAPABILITIES which is right before the JSDoc comment block
content = content.replace(
    '};\n\n/**',
    '\tDeveloper: ["tree_scans:read", "localization:read", "localization:update"],\n};\n\n/**'
);

// 2. Replace the DEVELOPER legacy role with the mapping, and add MANAGER, INSPECTOR, FARMER
content = content.replace(
    'DEVELOPER: ["tree_scans:read", "localization:read", "localization:update"],',
    'DEVELOPER: ROLE_CAPABILITIES["Developer"],\n\tMANAGER: ROLE_CAPABILITIES["Manager"],\n\tINSPECTOR: ROLE_CAPABILITIES["Inspector"],\n\tFARMER: ROLE_CAPABILITIES["Farmer"],'
);

fs.writeFileSync('src/middleware/capability.middleware.ts', content);
