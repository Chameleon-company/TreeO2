const fs = require('fs');
let content = fs.readFileSync('src/modules/auth/auth.types.ts', 'utf8');
content = content.replace(/\s*"Developer",?\n/g, '\n');
fs.writeFileSync('src/modules/auth/auth.types.ts', content);
