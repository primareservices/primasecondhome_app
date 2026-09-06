// Dlhší obsah (pravidlá, sprievodcovia, info o budove). EN je v hlavnom bundli ako záloha,
// ostatné jazyky sa sťahujú na požiadanie. Jazyk bez obsahu spadne na angličtinu.
import { CONTENT_LANGS } from '../config/languages.js';
import en from './en.js';

const LOADERS = {
  sk: () => import('./sk.js'),
  uk: () => import('./uk.js'),
  ru: () => import('./ru.js'),
};
const CACHE = { en };
export async function loadContent(lang) {
  if (CACHE[lang]) return CACHE[lang];
  if (!CONTENT_LANGS.includes(lang) || !LOADERS[lang]) return en;
  const mod = await LOADERS[lang]();
  CACHE[lang] = mod.default;
  return CACHE[lang];
}
export function contentSync(lang) { return CACHE[lang] || en; }
export function hasContent(lang) { return CONTENT_LANGS.includes(lang); }
// Text oznamu / poznámky personálu v jazyku hosťa s fallbackom en → sk → prvý dostupný.
export function pickText(obj, lang) {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.sk || Object.values(obj)[0] || null;
}
