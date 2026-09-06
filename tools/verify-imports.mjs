#!/usr/bin/env node
// Kontrola relatívnych importov v src/: súbor musí existovať a každý pomenovaný
// import musí byť v cieľovom súbore exportovaný. Build (esbuild) toto NEzachytí —
// chýbajúci export sa prejaví až v prehliadači ako `undefined is not a function`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const files = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(n) && files.push(p); } })(SRC);

const exportsOf = new Map();
function exportedNames(file) {
  if (exportsOf.has(file)) return exportsOf.get(file);
  const src = readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop(); if (n) names.add(n); }
  if (/export\s+default/.test(src)) names.add('default');
  exportsOf.set(file, names);
  return names;
}

let problems = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/import\s+([^'"]*?)\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const spec = m[2];
    const target = resolve(dirname(file), spec);
    if (!existsSync(target)) { console.log(`✗ ${relative(SRC, file)}: chýba súbor ${spec}`); problems++; continue; }
    const names = exportedNames(target);
    const clause = m[1].trim();
    const named = clause.match(/\{([^}]*)\}/);
    if (named) for (const part of named[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/)[0].trim();
      if (n && !names.has(n)) { console.log(`✗ ${relative(SRC, file)}: '${n}' nie je exportované z ${spec}`); problems++; }
    }
    const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
    if (def && !def.startsWith('*') && !names.has('default')) { console.log(`✗ ${relative(SRC, file)}: ${spec} nemá default export (${def})`); problems++; }
  }
  // dynamické importy prekladov a obsahu
  for (const m of src.matchAll(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
    const target = resolve(dirname(file), m[1]);
    if (!existsSync(target)) { console.log(`✗ ${relative(SRC, file)}: chýba súbor ${m[1]} (dynamický import)`); problems++; }
  }
}
console.log(problems ? `${problems} problém(ov) s importmi` : `✓ importy v poriadku (${files.length} súborov)`);
process.exit(problems ? 1 : 0);
