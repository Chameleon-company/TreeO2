const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');

const getModuleName = (fileName) => {
	const base = fileName.split('.')[0];
	// Convert camelCase to snake_case for capabilities (e.g. treeTypes -> tree_types)
	// But let's look at folder names or just simple logic
	return base.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const processFile = (filePath, moduleNameStr) => {
	let content = fs.readFileSync(filePath, 'utf8');
	
	// Skip if already migrated
	if (content.includes('requirePermission')) return;
	if (!content.includes('roleMiddleware')) return;
	
	// Replace import
	content = content.replace(
		/import\s*{\s*roleMiddleware\s*}\s*from\s*(['"])(.*?)\/middleware\/role\.middleware\1;/,
		'import { requirePermission } from "$2/middleware/capability.middleware";'
	);
	
	// Determine capability prefix based on folder name usually, or file name
	// Let's use the folder name with hyphens replaced by underscores
	const folderName = path.basename(path.dirname(filePath));
	const capabilityPrefix = folderName.replace(/-/g, '_');
	
	// Replace roleMiddleware with requirePermission
	// We'll use a regex to find router.(get|post|put|delete|patch) and capture the method, then replace roleMiddleware inside
	// Actually, an easier way is to just look for roleMiddleware([...]) and replace it based on the preceding router.METHOD
	
	const lines = content.split('\n');
	let currentMethod = null;
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		
		const methodMatch = line.match(/router\.(get|post|put|delete|patch)\(/);
		if (methodMatch) {
			currentMethod = methodMatch[1].toLowerCase();
		}
		
		if (line.includes('roleMiddleware(')) {
			let action = 'read';
			if (currentMethod === 'post') action = 'create';
			if (currentMethod === 'put' || currentMethod === 'patch') action = 'update';
			if (currentMethod === 'delete') action = 'delete';
			
			// Some specific exceptions: user-organisation-roles -> user_organisation_roles:assign/remove
			let cap = `${capabilityPrefix}:${action}`;
			if (capabilityPrefix === 'user_organisation_roles') {
				if (action === 'create') cap = `${capabilityPrefix}:assign`;
				if (action === 'delete') cap = `${capabilityPrefix}:remove`;
			}
			if (capabilityPrefix === 'user_project_roles') {
				if (action === 'create') cap = `${capabilityPrefix}:assign`;
				if (action === 'delete') cap = `${capabilityPrefix}:remove`;
			}
			
			lines[i] = line.replace(/roleMiddleware\([^)]+\)/, `requirePermission("${cap}")`);
		}
	}
	
	fs.writeFileSync(filePath, lines.join('\n'));
	console.log(`Migrated ${filePath}`);
};

const walkSync = (dir) => {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			walkSync(filePath);
		} else if (file.endsWith('.routes.ts')) {
			processFile(filePath, file);
		}
	}
};

walkSync(modulesDir);
