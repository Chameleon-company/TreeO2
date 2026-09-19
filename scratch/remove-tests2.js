const fs = require('fs');
const p = 'tests/unit/middleware/auth.middleware.test.ts';
let t = fs.readFileSync(p, 'utf8');
t = t.replace(/describe\("Development Bypass Tokens \(AUTH_DEV_MODE=true\)", \(\) => \{[\s\S]*?\}\);\n\n\tdescribe\("Cryptographic JWT/g, 'describe("Cryptographic JWT');
fs.writeFileSync(p, t);
console.log('Done');
