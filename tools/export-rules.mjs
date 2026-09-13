// Export ubytovacieho poriadku z obsahu appky do SQL pre tabuľku rules (verzia + texty po jazykoch).
// Sieťový vzor (src/content/*.js) → property_id NULL; balík budovy (src/content/packs/<budova>) → jej property_id.
// Použitie: node tools/export-rules.mjs > supabase/seed/rules.sql   (spustiť v SQL editore Supabase)
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));   // koreň repozitára, nezávisle od cwd
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
async function loadDir(dir) {
  const out = {};
  for (const f of readdirSync(ROOT + dir).filter(x => /^[a-z]{2}\.js$/.test(x))) {
    const m = await import(new URL(dir + '/' + f, 'file://' + ROOT));
    const c = m.default || m;
    if (c && c.rules) out[f.slice(0, 2)] = c.rules;
  }
  return out;
}
function row(propertyId, texts) {
  const version = Object.values(texts)[0].version;
  const clean = Object.fromEntries(Object.entries(texts).map(([k, v]) => [k, { intro: v.intro, items: v.items, sections: v.sections, version: v.version }]));
  return `insert into public.rules (property_id, version, texts) values (${propertyId ? q(propertyId) : 'null'}, ${q(version)}, ${q(JSON.stringify(clean))}::jsonb)\n  on conflict ((coalesce(property_id, '')), version) do update set texts = excluded.texts;`;
}
const lines = ['-- Vygenerované tools/export-rules.mjs ' + new Date().toISOString().slice(0, 10), ''];
lines.push(row(null, await loadDir('src/content')));
const packs = 'src/content/packs';
for (const d of readdirSync(ROOT + packs)) {
  const dir = packs + '/' + d;
  if (!existsSync(ROOT + dir + '/sk.js')) continue;
  const texts = await loadDir(dir);
  if (Object.keys(texts).length) lines.push(row('p_' + d, texts));
}
console.log(lines.join('\n'));
