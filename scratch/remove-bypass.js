const fs = require('fs');
let m = fs.readFileSync('src/middleware/auth.middleware.ts', 'utf8');

// Remove getDevTokenUsers and cached map
m = m.replace(/let cachedDevTokenUsers[\s\S]*?return cachedDevTokenUsers;\n};/, '');

// Remove bypass evaluation block
m = m.replace(/\/\/ 2\. Development Bypass Token Engine \([\s\S]*?if \(\s*devUser\s*\) \{\s*req\.user = devUser;\s*next\(\);\s*return;\s*\}\s*\}/, '');

fs.writeFileSync('src/middleware/auth.middleware.ts', m);
console.log('Removed dev token bypass from auth.middleware.ts');
