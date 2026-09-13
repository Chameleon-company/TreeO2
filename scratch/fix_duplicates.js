const fs = require('fs');

const filePath = 'tests/unit/middleware/projectScope.middleware.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The original file had these three lines, so let's remove the ones my script injected right after 'scope: "project"'
// Actually, it's easier to just find the exact block and replace it.

const badBlock = `			scope: "project",
			jti: "test-jti",
			iat: 123456789,
			exp: 987654321,
			organisationId: 10,
			organisationRole: "Member",
			projectId: 100,
			projectRoles: ["Manager"],
			jti: "test-jti",
			iat: 1710000000,
			exp: 1710000900,`;

const goodBlock = `			scope: "project",
			organisationId: 10,
			organisationRole: "Member",
			projectId: 100,
			projectRoles: ["Manager"],
			jti: "test-jti",
			iat: 1710000000,
			exp: 1710000900,`;

content = content.replace(badBlock, goodBlock);

fs.writeFileSync(filePath, content);
