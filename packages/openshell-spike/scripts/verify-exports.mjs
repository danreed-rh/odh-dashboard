#!/usr/bin/env node
/**
 * Verifies openshell-dashboard package.json exports resolve to built dist files.
 * Expects a local clone with `npm run build:lib` already run in frontend/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const pkgRoot = path.resolve(
  __dirname,
  '../../../../openshell-dashboard/frontend',
);
const pkgJsonPath = path.join(pkgRoot, 'package.json');

if (!fs.existsSync(pkgJsonPath)) {
  console.error(`Missing upstream package at ${pkgJsonPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const exportsMap = pkg.exports ?? {};
const required = ['./pages', './components', './api', './types', './slots'];

let failed = false;
for (const key of required) {
  const entry = exportsMap[key];
  if (!entry) {
    console.error(`FAIL: missing export ${key}`);
    failed = true;
    continue;
  }
  const typesRel = entry.types;
  const defaultRel = entry.default;
  for (const rel of [typesRel, defaultRel]) {
    const abs = path.join(pkgRoot, rel);
    if (!fs.existsSync(abs)) {
      console.error(`FAIL: ${key} -> ${rel} not found (run build:lib in upstream frontend)`);
      failed = true;
    } else {
      console.log(`OK: ${key} -> ${rel}`);
    }
  }
}

// Resolve via Node package exports (same mechanism npm consumers use).
try {
  const resolved = require.resolve('openshell-dashboard/pages', {
    paths: [path.resolve(__dirname, '..')],
  });
  console.log(`OK: require.resolve(openshell-dashboard/pages) -> ${resolved}`);
} catch (err) {
  // Falls back to path resolution when spike node_modules not installed yet.
  const pagesJs = path.join(pkgRoot, 'dist/pages/index.js');
  if (fs.existsSync(pagesJs)) {
    console.log(
      `OK: dist pages present (install spike deps for package exports resolve): ${pagesJs}`,
    );
  } else {
    console.error('FAIL: cannot resolve openshell-dashboard/pages', err);
    failed = true;
  }
}

console.log('\npeerDependencies (upstream):');
console.log(JSON.stringify(pkg.peerDependencies, null, 2));

process.exit(failed ? 1 : 0);
