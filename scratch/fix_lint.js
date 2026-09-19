const fs = require('fs');

// 1. auth.middleware.ts
const authMidPath = 'src/middleware/auth.middleware.ts';
let authMid = fs.readFileSync(authMidPath, 'utf8');
authMid = authMid.replace(/import\s*\{\s*env\s*\}\s*from\s*"..\/config\/env";\n?/, '');
authMid = authMid.replace(/import\s*type\s*\{\s*JwtPayload\s*\}\s*from\s*"..\/modules\/auth\/auth.types";\n?/, '');
fs.writeFileSync(authMidPath, authMid);

// 2. scanBatches.routes.ts
const sbPath = 'src/modules/scan-batches/scanBatches.routes.ts';
let sb = fs.readFileSync(sbPath, 'utf8');
sb = sb.replace(/import\s*\{\s*SCAN_BATCHES_AUTH_ROLES\s*\}\s*from\s*"\.\/scan-batches\.constants";\n?/, '');
fs.writeFileSync(sbPath, sb);

// 3. auth.test.ts
const authTestPath = 'tests/unit/auth.test.ts';
let authTest = fs.readFileSync(authTestPath, 'utf8');
authTest = authTest.replace(/const randomBytes = require\("crypto"\)\.randomBytes;/g, 'import { randomBytes } from "crypto";');
fs.writeFileSync(authTestPath, authTest);

console.log('Linting errors fixed!');
