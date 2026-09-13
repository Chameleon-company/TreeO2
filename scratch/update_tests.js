const fs = require('fs');
const file = 'tests/unit/middleware/capability.middleware.test.ts';
let content = fs.readFileSync(file, 'utf8');

const mockMatrices = `
const MOCK_MATRIX: Record<string, readonly string[]> = {
	Manager: ['reports:create', 'tree_scans:read'],
	Inspector: ['tree_scans:create'],
	Farmer: ['tree_scans:read'],
};

const MOCK_LEGACY_MATRIX: Record<string, readonly string[]> = {
	ADMIN: ['projects:create'],
	DEVELOPER: ['localization:read'],
};

`;

content = content.replace('describe("requirePermission', mockMatrices + 'describe("requirePermission');
content = content.replace(/requirePermission\("(.*?)"\)/g, 'requirePermission("$1", MOCK_MATRIX, MOCK_LEGACY_MATRIX)');

fs.writeFileSync(file, content);
