const fs = require('fs');
let content = fs.readFileSync('src/middleware/capability.middleware.ts', 'utf8');
content = content.replace(
    'DEVELOPER: ["tree_scans:read", "localization:read", "localization:update"],\n} as const;',
    'DEVELOPER: ["tree_scans:read", "localization:read", "localization:update"],\n\tMANAGER: ROLE_CAPABILITIES["Manager"],\n\tINSPECTOR: ROLE_CAPABILITIES["Inspector"],\n\tFARMER: ROLE_CAPABILITIES["Farmer"],\n} as const;'
);
fs.writeFileSync('src/middleware/capability.middleware.ts', content);
