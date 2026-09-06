#!/usr/bin/env node
// Každý jazyk musí mať všetky kľúče z en.js a rovnaké {premenné}. Chýbajúci kľúč
// by v appke potichu spadol na angličtinu — tu sa to ukáže pred buildom.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = fileURLToPath(new URL('../src/i18n/translations/', import.meta.url));
const load = async (f) => (await import(pathToFileURL(dir + f).href)).default;
const en = await load('en.js');
const vars = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
let problems = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
  const d = await load(f);
  const missing = Object.keys(en).filter(k => !(k in d));
  const extra = Object.keys(d).filter(k => !(k in en));
  const badVars = Object.keys(d).filter(k => k in en && vars(d[k]) !== vars(en[k]));
  const empty = Object.keys(d).filter(k => !String(d[k]).trim());
  if (missing.length || extra.length || badVars.length || empty.length) problems++;
  console.log(`${f.padEnd(6)} ${Object.keys(d).length} kľúčov` +
    (missing.length ? ` · chýba ${missing.length}: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}` : '') +
    (extra.length ? ` · navyše ${extra.length}: ${extra.slice(0, 5).join(', ')}` : '') +
    (badVars.length ? ` · iné {premenné}: ${badVars.slice(0, 5).join(', ')}` : '') +
    (empty.length ? ` · prázdne: ${empty.slice(0, 5).join(', ')}` : ''));
}
console.log(problems ? `✗ ${problems} jazyk(ov) s problémami` : '✓ preklady kompletné');
process.exit(problems ? 1 : 0);
