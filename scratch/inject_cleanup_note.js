const fs = require('fs');
let content = fs.readFileSync('tests/unit/middleware/capability.middleware.test.ts', 'utf8');
content = content.replace('it("should allow legacy ADMIN role string', '// [AUTH-CLEANUP] Note: These legacy role tests should be removed when the legacy role string fallback is deleted from the middleware.\\n\\t\\tit("should allow legacy ADMIN role string');
fs.writeFileSync('tests/unit/middleware/capability.middleware.test.ts', content);
