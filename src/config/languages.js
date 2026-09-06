// Jazyky UI. Poradie = poradie v ponuke (podľa veľkosti skupín hostí, pozri docs/RESEARCH.md §3).
// `name` je v písme daného jazyka — hosť si musí nájsť svoj jazyk bez čítania cudzieho.
export const LANGS = [
  { code: 'sk', name: 'Slovenčina', short: 'SK', locale: 'sk-SK' },
  { code: 'en', name: 'English',    short: 'EN', locale: 'en-GB' },
  { code: 'uk', name: 'Українська', short: 'UK', locale: 'uk-UA' },
  { code: 'ru', name: 'Русский',    short: 'RU', locale: 'ru-RU' },
  { code: 'sr', name: 'Srpski',     short: 'SR', locale: 'sr-Latn-RS' },
  { code: 'ro', name: 'Română',     short: 'RO', locale: 'ro-RO' },
  { code: 'hu', name: 'Magyar',     short: 'HU', locale: 'hu-HU' },
  { code: 'vi', name: 'Tiếng Việt', short: 'VI', locale: 'vi-VN' },
  { code: 'hi', name: 'हिन्दी',      short: 'HI', locale: 'hi-IN' },
  { code: 'ne', name: 'नेपाली',      short: 'NE', locale: 'ne-NP' },
  { code: 'uz', name: 'Oʻzbekcha',  short: 'UZ', locale: 'uz-Latn-UZ' },
  { code: 'tl', name: 'Filipino',   short: 'TL', locale: 'fil-PH' },
];
export const LANG_CODES = LANGS.map(l => l.code);
export const DEFAULT_LANG = 'en';
// Reťazec, ktorý v jazyku chýba, spadne na angličtinu a potom na slovenčinu.
export const FALLBACK_CHAIN = ['en', 'sk'];
// Dlhší obsah (pravidlá, sprievodcovia, info o budove) je zatiaľ v týchto jazykoch;
// ostatné spadnú na angličtinu. Rozšírenie: docs/TRANSLATION_STATUS.md.
export const CONTENT_LANGS = ['en', 'sk', 'uk', 'ru'];

export function langMeta(code) { return LANGS.find(l => l.code === code) || LANGS.find(l => l.code === DEFAULT_LANG); }
export function localeOf(code) { return langMeta(code).locale; }
// Prvý jazyk prehliadača, ktorý poznáme (uz-Latn → uz, fil → tl).
export function detectLang(navLangs) {
  for (const raw of (navLangs || [])) {
    const base = String(raw || '').toLowerCase().split(/[-_]/)[0];
    const code = base === 'fil' ? 'tl' : base;
    if (LANG_CODES.includes(code)) return code;
  }
  return DEFAULT_LANG;
}
