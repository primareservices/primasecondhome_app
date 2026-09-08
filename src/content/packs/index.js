// Balíky obsahu po budovách. Fakty sú jazykovo neutrálne (facts.js), texty po jazykoch
// s fallbackom na angličtinu (rovnako ako sieťový obsah v src/content/index.js).
import tarifFacts from './tarif/facts.js';
import tarifEn from './tarif/en.js';
import tarifSk from './tarif/sk.js';

const PACKS = {
  p_tarif: {
    facts: tarifFacts,
    texts: { en: tarifEn, sk: tarifSk },
    loaders: { uk: () => import('./tarif/uk.js'), ru: () => import('./tarif/ru.js') },
  },
};
export function hasPack(propertyId) { return !!PACKS[propertyId]; }

function merge(base, over) {
  if (!over) return base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? merge(base[k], over[k]) : over[k];
  return out;
}
export function packSync(propertyId, lang) {
  const p = PACKS[propertyId];
  if (!p) return null;
  const t = p.texts[lang] ? merge(p.texts.en, p.texts[lang]) : p.texts.en;
  // Texty (rules, emergency, city, howTo, factsText) + jazykovo neutrálne fakty (facts).
  return { ...t, factsText: t.facts, facts: p.facts, lang: p.texts[lang] ? lang : 'en' };
}
export async function loadPack(propertyId, lang) {
  const p = PACKS[propertyId];
  if (!p) return null;
  if (!p.texts[lang] && p.loaders[lang]) { const mod = await p.loaders[lang](); p.texts[lang] = mod.default; }
  return packSync(propertyId, lang);
}
