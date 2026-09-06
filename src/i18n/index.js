import { createContext, useContext } from 'react';
import { DEFAULT_LANG, FALLBACK_CHAIN, LANG_CODES } from '../config/languages.js';
import en from './translations/en.js';
import sk from './translations/sk.js';

// SK a EN sú v hlavnom bundli (záložné jazyky). Ostatné sa sťahujú až po výbere —
// hosť s pomalými dátami nemá platiť za 11 jazykov, ktoré nečíta.
const LOADERS = {
  uk: () => import('./translations/uk.js'),
  ru: () => import('./translations/ru.js'),
  sr: () => import('./translations/sr.js'),
  ro: () => import('./translations/ro.js'),
  hu: () => import('./translations/hu.js'),
  vi: () => import('./translations/vi.js'),
  hi: () => import('./translations/hi.js'),
  ne: () => import('./translations/ne.js'),
  uz: () => import('./translations/uz.js'),
  tl: () => import('./translations/tl.js'),
};
const DICTS = { en, sk };

export async function loadDict(lang) {
  if (DICTS[lang]) return DICTS[lang];
  const loader = LOADERS[lang];
  if (!loader) return DICTS[DEFAULT_LANG];
  const mod = await loader();
  DICTS[lang] = mod.default;
  return DICTS[lang];
}
export function hasDict(lang) { return !!DICTS[lang]; }

export function makeT(lang) {
  const dict = DICTS[lang] || DICTS[DEFAULT_LANG];
  return function t(key, vars) {
    let s = dict[key];
    if (s == null) for (const fb of FALLBACK_CHAIN) { if (DICTS[fb] && DICTS[fb][key] != null) { s = DICTS[fb][key]; break; } }
    if (s == null) s = key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  };
}

export const I18nContext = createContext({ t: k => k, lang: DEFAULT_LANG, setLang: () => {}, ready: true });
export const useT = () => useContext(I18nContext);

const LS_LANG = 'primaHome:lang';
export function readStoredLang() {
  try { const v = localStorage.getItem(LS_LANG); return LANG_CODES.includes(v) ? v : null; } catch { return null; }
}
export function storeLang(code) { try { localStorage.setItem(LS_LANG, code); } catch {} }
