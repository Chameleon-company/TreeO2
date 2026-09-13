const fs = require('fs');
let content = fs.readFileSync('src/modules/auth/auth.types.ts', 'utf8');
content = content.replace(
    '"Manager",\n] as const;',
    '"Manager",\n\t"Developer",\n] as const;'
);
fs.writeFileSync('src/modules/auth/auth.types.ts', content);
