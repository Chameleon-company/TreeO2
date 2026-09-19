const fs = require('fs');
const path = require('path');

const domainMap = {
    'adopters': 'adopters',
    'adoptions': 'adoptions',
    'auth': 'auth',
    'localization': 'localization',
    'partners': 'partners',
    'projectManagement': 'projects',
    'projectTreeTypes': 'project_tree_types',
    'scanBatches': 'scan_batches',
    'treeScans': 'tree_scans',
    'treeTypes': 'tree_types',
    'userManagement': 'users',
    'userOrganisationRoles': 'user_organisation_roles',
    'userOrganisations': 'user_organisations',
    'userProjectAssignment': 'user_project_roles'
};

function getDomain(filename) {
    const base = filename.replace('.routes.ts', '');
    return domainMap[base] || base;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import
    content = content.replace(
        /import\s*\{\s*roleMiddleware\s*\}\s*from\s*"[^"]+role\.middleware";/,
        'import { requirePermission } from "../../middleware/capability.middleware";'
    );
    
    const domain = getDomain(path.basename(filePath));

    // Regex to find router.verb(..., roleMiddleware(...), ...)
    // It's hard to parse perfectly with regex, so we'll look for router.METHOD(/path, ... roleMiddleware([...]),
    
    const methodRegex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["'][\s\S]*?(roleMiddleware\([^)]+\))/g;
    
    content = content.replace(methodRegex, (match, method, routePath, roleMid) => {
        let action = '';
        if (method === 'get') action = 'read';
        else if (method === 'post') action = 'create';
        else if (method === 'put' || method === 'patch') action = 'update';
        else if (method === 'delete') action = 'delete';

        // Custom mappings for special routes
        if (routePath.includes('recycle')) action = 'update';
        if (routePath.includes('correct')) action = 'correct';
        if (routePath.includes('archive')) action = 'archive';
        if (routePath.includes('assign')) action = 'assign';
        if (routePath.includes('remove')) action = 'remove';

        const capability = `${domain}:${action}`;
        
        return match.replace(roleMid, `requirePermission("${capability}")`);
    });

    fs.writeFileSync(filePath, content);
}

function findRoutes(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findRoutes(fullPath);
        } else if (fullPath.endsWith('.routes.ts')) {
            console.log(`Processing ${fullPath}`);
            processFile(fullPath);
        }
    }
}

findRoutes('src/modules');
