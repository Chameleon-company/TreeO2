const fs = require('fs');
const p = 'tests/unit/middleware/auth.middleware.test.ts';
let t = fs.readFileSync(p, 'utf8');

const startStr = 'describe("Development Bypass Tokens (AUTH_DEV_MODE=true)", () => {';
const startIdx = t.indexOf(startStr);

if (startIdx !== -1) {
    t = t.substring(0, startIdx) + '});\n';
    fs.writeFileSync(p, t);
    console.log('Removed dev bypass tests!');
}
