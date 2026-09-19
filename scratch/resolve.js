const fs = require('fs');
const p = 'src/middleware/auth.middleware.ts';
let t = fs.readFileSync(p, 'utf8');

// It looks like:
// <<<<<<< HEAD
// 	
// =======
// 	// 2. Development Bypass Token Engine (AUTH_DEV_MODE=true)
// ...
// >>>>>>> origin/master

t = t.replace(/<<<<<<< HEAD\r?\n\s*\r?\n=======\r?\n[\s\S]*?>>>>>>> origin\/master/g, '');
fs.writeFileSync(p, t);
console.log('Resolved conflict in auth.middleware.ts');
