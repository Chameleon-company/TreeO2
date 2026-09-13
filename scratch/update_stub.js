const fs = require('fs');
const file = 'src/middleware/capability.middleware.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the Manager capabilities block
const newManagerBlock = `	Manager: [
		"projects:read",
		"projects:update",
		"project_organisations:read",
		"project_organisations:create",
		"project_organisations:delete",
		"users:create",
		"users:read",
		"users:update",
		"users:delete",
		"user_organisations:read",
		"user_organisations:create",
		"user_organisations:update",
		"user_organisations:delete",
		"user_organisation_roles:assign",
		"user_organisation_roles:remove",
		"user_project_roles:read",
		"user_project_roles:assign",
		"user_project_roles:remove",
		"tree_types:read",
		"tree_scans:create",
		"tree_scans:read",
		"tree_scans:correct",
		"tree_scans:archive",
		"tree_scans:validate",
		"scan_batches:create",
		"scan_batches:read",
		"scan_batches:archive",
		"reports:create",
		"reports:read",
		"dashboard:read",
		"farms:create",
		"farms:read",
		"farms:update",
		"farms:archive",
		"farm_boundaries:read",
		"farm_boundaries:upload",
		"localized_strings:read",
		"localized_strings:update",
		"partners:read",
		"partners:create",
		"partners:update",
		"partners:delete",
		"adopters:read",
		"adopters:create",
		"adopters:update",
		"adopters:delete",
		"adoptions:read",
		"adoptions:create",
		"adoptions:update",
		"adoptions:delete",
	],`;

// The original Manager block we're replacing
const regex = /Manager:\s*\[[\s\S]*?farm_boundaries:upload",\s*\],/;
content = content.replace(regex, newManagerBlock);

fs.writeFileSync(file, content);
