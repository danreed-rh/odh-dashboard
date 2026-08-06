#!/usr/bin/env node
/**
 * Upstream build:lib (tsc) emits JS under dist/ but does not copy CSS.
 * Host + MF remotes resolve `import './Foo.css'` next to dist JS and fail.
 * Mirror src CSS into dist until openshell-dashboard ships CSS in the package.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  // file: dep from packages/openshell/frontend
  path.resolve(__dirname, '../frontend/node_modules/openshell-dashboard'),
  // sibling clone (monorepo layout)
  path.resolve(__dirname, '../../../../openshell-dashboard/frontend'),
];

const pkgRoot = candidates.find(
  (p) => fs.existsSync(path.join(p, 'src')) && fs.existsSync(path.join(p, 'dist')),
);

if (!pkgRoot) {
  console.error(
    'Could not find openshell-dashboard with src/ + dist/. Run build:lib first.',
  );
  process.exit(1);
}

const srcRoot = path.join(pkgRoot, 'src');
const distRoot = path.join(pkgRoot, 'dist');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.name.endsWith('.css')) out.push(full);
  }
  return out;
}

const files = walk(srcRoot);
for (const file of files) {
  const rel = path.relative(srcRoot, file);
  const dest = path.join(distRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

console.log(`Synced ${files.length} CSS file(s) into ${distRoot}`);
