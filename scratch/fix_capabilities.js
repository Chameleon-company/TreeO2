const fs = require('fs');

// 1. Fix localization routes string typo
const locPath = 'src/modules/localization/localization.routes.ts';
let locContent = fs.readFileSync(locPath, 'utf8');
locContent = locContent.replace(/"localization:/g, '"localized_strings:');
fs.writeFileSync(locPath, locContent);

// 2. Fix capability matrix (add missing ones)
const capPath = 'src/middleware/capability.middleware.ts';
let capContent = fs.readFileSync(capPath, 'utf8');
capContent = capContent.replace(
    /"tree_types:read",/,
    '"tree_types:read",\n\t\t"project_tree_types:read",'
);
capContent = capContent.replace(
    /"scan_batches:create",/,
    '"scan_batches:create",\n\t\t"scan_batches:read",'
);
fs.writeFileSync(capPath, capContent);
console.log('Fixed matrix and localization routes');
