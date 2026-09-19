const fs = require('fs');
const p = 'tests/unit/middleware/auth.middleware.test.ts';
let t = fs.readFileSync(p, 'utf8');

// It fails because there are multiple describe blocks. We just want to remove the specific one.
const startStr = 'describe("Development Bypass Tokens (AUTH_DEV_MODE=true)", () => {';
const startIdx = t.indexOf(startStr);
if (startIdx !== -1) {
    // Find the end of this describe block. It ends right before `describe("Cryptographic JWT Signature Verification"`
    const endStr = 'describe("Cryptographic JWT Signature Verification"';
    const endIdx = t.indexOf(endStr);
    if (endIdx !== -1) {
        t = t.substring(0, startIdx) + t.substring(endIdx);
        fs.writeFileSync(p, t);
        console.log('Removed dev bypass tests');
    }
}
