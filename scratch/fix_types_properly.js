const fs = require('fs');

function addFields(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add required fields to IdentityJwtPayload mocks
    content = content.replace(
        /scope: "identity",/g,
        'scope: "identity",\n\t\t\tjti: "test-jti",\n\t\t\tiat: 123456789,\n\t\t\texp: 987654321,\n\t\t\torganisations: [],'
    );

    // Add required fields to ProjectJwtPayload mocks
    content = content.replace(
        /scope: "project"( as const)?,/g,
        'scope: "project"$1,\n\t\t\tjti: "test-jti",\n\t\t\tiat: 123456789,\n\t\t\texp: 987654321,'
    );

    fs.writeFileSync(filePath, content);
}

addFields('tests/unit/middleware/capability.middleware.test.ts');
addFields('tests/unit/middleware/projectScope.middleware.test.ts');
