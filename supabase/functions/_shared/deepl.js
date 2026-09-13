// DeepL cez API (kľúč v secrets DEEPL_KEY; „:fx“ = free API). Jazyky appky bez podpory v DeepL
// (sr, hi, ne, uz, tl) ostávajú bez prekladu — klient ukáže angličtinu alebo originál.
import { env } from './env.js';
export const DEEPL_LANG = { sk: 'SK', en: 'EN-GB', uk: 'UK', ru: 'RU', ro: 'RO', hu: 'HU', vi: 'VI' };
export function deeplSupports(lang) { return !!DEEPL_LANG[lang]; }
export async function translate(text, targets, { source = null, fetchImpl } = {}) {
  const key = env('DEEPL_KEY');
  const out = {};
  const t = String(text || '').trim().slice(0, 2000);
  if (!key || !t) return out;
  const endpoint = key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
  const f = fetchImpl || ((...a) => fetch(...a));
  for (const lang of [...new Set(targets)].filter(deeplSupports)) {
    if (source && source === lang) { out[lang] = t; continue; }
    try {
      const r = await f(endpoint, { method: 'POST', headers: { Authorization: 'DeepL-Auth-Key ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: [t], target_lang: DEEPL_LANG[lang], ...(source && DEEPL_LANG[source] ? { source_lang: DEEPL_LANG[source].slice(0, 2) } : {}) }) });
      if (!r.ok) continue;
      const j = await r.json();
      const tr = j && j.translations && j.translations[0];
      if (tr && tr.text) { out[lang] = tr.text; if (!out.src && tr.detected_source_language) out.src = tr.detected_source_language.toLowerCase(); }
    } catch { /* preklad je bonus, nie podmienka */ }
  }
  return out;
}
