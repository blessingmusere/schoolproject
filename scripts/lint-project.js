const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignored = new Set(['node_modules', '.git', 'dist', '.expo']);
const textExtensions = new Set(['.js', '.json', '.md', '.sql', '.ts', '.toml']);
const mojibakePattern = new RegExp([0xf0, 0xe2, 0xc2].map((code) => String.fromCharCode(code)).join('|'));

const failures = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(fullPath, 'utf8');
    if (mojibakePattern.test(text)) {
      failures.push(`Mojibake-like characters found in ${path.relative(root, fullPath)}`);
    }
  }
};

walk(root);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const lockedDeps = lock.packages[''].dependencies || {};
for (const [name, version] of Object.entries(pkg.dependencies || {})) {
  if (lockedDeps[name] !== version) {
    failures.push(`package-lock root dependency mismatch for ${name}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Project lint checks passed.');
