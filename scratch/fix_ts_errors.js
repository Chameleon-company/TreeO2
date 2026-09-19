const fs = require('fs');

// 1. Fix auth.test.ts (re-add import bcrypt from 'bcryptjs')
const authPath = 'tests/unit/auth.test.ts';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = 'import bcrypt from "bcryptjs";\n' + authContent;
fs.writeFileSync(authPath, authContent);

// 2. Fix user-management.test.ts (remove local sign usage)
const umPath = 'tests/integration/user-management.test.ts';
let umContent = fs.readFileSync(umPath, 'utf8');
umContent = umContent.replace(/const token = sign\(\{ id: inspector.id, role: "INSPECTOR" \}\);/, 'const token = TOKENS.INSPECTOR;');
fs.writeFileSync(umPath, umContent);

console.log('Fixed final TS errors');
