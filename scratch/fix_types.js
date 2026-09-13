const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/: IdentityJwtPayload = {/g, ' = { /* TS fix */');
    content = content.replace(/: ProjectJwtPayload = {/g, ' = { /* TS fix */');
    
    // We also need to add 'as any' when it's passed, or just type the variable as 'any'
    content = content.replace(/const systemAdminUser = {/g, 'const systemAdminUser: any = {');
    content = content.replace(/const orgAdminUser = {/g, 'const orgAdminUser: any = {');
    content = content.replace(/const managerUser = {/g, 'const managerUser: any = {');
    content = content.replace(/const inspectorUser = {/g, 'const inspectorUser: any = {');
    content = content.replace(/const multiRoleUser = {/g, 'const multiRoleUser: any = {');
    content = content.replace(/const farmerUser = {/g, 'const farmerUser: any = {');
    content = content.replace(/const identityUser = {/g, 'const identityUser: any = {');
    content = content.replace(/const adminUser = {/g, 'const adminUser: any = {');
    
    fs.writeFileSync(filePath, content);
}

fixFile('tests/unit/middleware/capability.middleware.test.ts');
fixFile('tests/unit/middleware/projectScope.middleware.test.ts');
