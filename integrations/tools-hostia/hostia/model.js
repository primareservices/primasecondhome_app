// ── Modul Hostia (PRIMA TOOLS): čistá logika bez Reactu a siete ──────────────────────
// Kódy pre hostí, normalizácia priezviska (zrkadlo guest_norm_surname v DB hostí), import
// z mesačného exportu Casistu (riadky po osobách: Meno, Príchod, Odchod, Izba, Poznámka),
// texty lístka v 12 jazykoch. Testy: test/tools-hostia-model.test.mjs v repe hosťovskej appky.

export const HOME_URL = 'https://home.primare.sk';
export const LANGS = [
  ['sk', 'Slovenčina'], ['en', 'English'], ['uk', 'Українська'], ['ru', 'Русский'], ['sr', 'Srpski'], ['ro', 'Română'],
  ['hu', 'Magyar'], ['vi', 'Tiếng Việt'], ['hi', 'हिन्दी'], ['ne', 'नेपाली'], ['uz', 'O‘zbekcha'], ['tl', 'Filipino'],
];
export const LANG_NAME = Object.fromEntries(LANGS);
// Prevádzky ako v appke hostí (id v DB hostí + prefix kódu)
export const PROPERTIES = [
  { id: 'p_ic15', qr: 'IC15', name: 'PRIMA IC 15' }, { id: 'p_ic23', qr: 'IC23', name: 'PRIMA IC 23' }, { id: 'p_tarif', qr: 'TARIF', name: 'PRIMA Tarif' },
  { id: 'p_nukleon', qr: 'NUK', name: 'PRIMA Nukleon' }, { id: 'p_nitra', qr: 'NITRA', name: 'PRIMA Nitra' }, { id: 'p_galanta', qr: 'GAL', name: 'PRIMA Galanta' },
];
export const propertyById = (id) => PROPERTIES.find(p => p.id === id) || null;

// Kód z lístka: PREFIX-XXXXXX, 6 znakov bez zameniteľných (0/O, 1/I/L). Ukladá sa len odtlačok.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function genCode(propertyId, rnd = Math.random) {
  const p = propertyById(propertyId);
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(rnd() * ALPHABET.length) % ALPHABET.length];
  return (p ? p.qr : 'PRIMA') + '-' + s;
}
export const normSurname = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
export function normalizeRoomCode(input) {
  let s = String(input || '').trim().replace(/\s+/g, '').replace(/[\\–—]/g, '/');
  if (!s) return '';
  const i = s.indexOf('/');
  if (i > 0) { const sub = s.slice(i + 1); s = s.slice(0, i).toUpperCase() + '/' + (sub.toLowerCase() === 'bunka' ? 'bunka' : sub.toUpperCase()); }
  else s = s.toUpperCase();
  return s;
}
// „Kovalenko Oleksandr“ (export Casistu má priezvisko prvé) → { surname, given }
export function splitName(full, surnameFirst = true) {
  const parts = String(full || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (!parts.length) return { surname: '', given: '' };
  if (parts.length === 1) return { surname: parts[0], given: '' };
  return surnameFirst ? { surname: parts[0], given: parts.slice(1).join(' ') } : { surname: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
}
// Meno v appke: „Oleksandr K.“ (krstné + iniciála) — hosť sa spozná, spolubývajúci nie.
export function displayName({ surname, given }) {
  const g = String(given || '').trim(), s = String(surname || '').trim();
  if (g && s) return g + ' ' + s[0].toUpperCase() + '.';
  return g || s;
}

// ── dátumy z exportu: '15.6.2026', '2026-06-15', Excel sériové číslo ──────────────────
export function toISODate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 864e5)); return isNaN(d) ? null : d.toISOString().slice(0, 10); }
  const s = String(v).trim();
  let m = /^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return m[0];
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}
const keyOf = (h) => String(h || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const COLS = { meno: ['meno', 'menoapriezvisko', 'hostmeno', 'priezviskoameno'], prichod: ['prichod', 'datumprichodu', 'od'], odchod: ['odchod', 'datumodchodu', 'do'], izba: ['izba', 'cisloizby', 'izbac'], pozn: ['poznamka', 'pozn'], firma: ['firma', 'spolocnost', 'klient', 'zamestnavatel'] };
// Riadky zo sheet_to_json (objekty s hlavičkami) → pobyty na založenie. Bez mena alebo izby sa preskočia.
export function parseStaysRows(rows, { surnameFirst = true } = {}) {
  if (!Array.isArray(rows) || !rows.length) return { stays: [], skipped: 0, columns: {} };
  const headers = Object.keys(rows[0]);
  const map = {};
  for (const [k, names] of Object.entries(COLS)) { const h = headers.find(x => names.includes(keyOf(x))); if (h) map[k] = h; }
  const stays = []; let skipped = 0;
  for (const r of rows) {
    const name = map.meno ? String(r[map.meno] || '').trim() : '';
    const room = map.izba ? normalizeRoomCode(r[map.izba]) : '';
    if (!name || !room) { skipped += 1; continue; }
    const { surname, given } = splitName(name, surnameFirst);
    stays.push({ name, surname, given, displayName: displayName({ surname, given }), room, checkIn: map.prichod ? toISODate(r[map.prichod]) : null, checkOut: map.odchod ? toISODate(r[map.odchod]) : null,
      company: map.firma ? String(r[map.firma] || '').trim() || null : null, note: map.pozn ? String(r[map.pozn] || '').trim() || null : null });
  }
  return { stays, skipped, columns: map };
}

// ── lístok pri check-ine: texty (jazyk hosťa prvý, potom SK + EN + 2 najbežnejšie) ─────
export const SLIP_TEXT = {
  sk: { title: 'Vitajte v PRIMA', line: 'Stiahnite si aplikáciu PRIMA SECOND HOME (naskenujte QR) a zadajte tento kód a prvé 3 písmená priezviska.', valid: 'Kód platí 14 dní od vydania.' },
  en: { title: 'Welcome to PRIMA', line: 'Open the PRIMA SECOND HOME app (scan the QR code) and enter this code plus the first 3 letters of your surname.', valid: 'The code is valid for 14 days.' },
  uk: { title: 'Ласкаво просимо до PRIMA', line: 'Відкрийте застосунок PRIMA SECOND HOME (скануйте QR) і введіть цей код та перші 3 літери прізвища.', valid: 'Код дійсний 14 днів.' },
  ru: { title: 'Добро пожаловать в PRIMA', line: 'Откройте приложение PRIMA SECOND HOME (сканируйте QR) и введите этот код и первые 3 буквы фамилии.', valid: 'Код действует 14 дней.' },
  sr: { title: 'Dobro došli u PRIMA', line: 'Otvorite aplikaciju PRIMA SECOND HOME (skenirajte QR) i unesite ovaj kod i prva 3 slova prezimena.', valid: 'Kod važi 14 dana.' },
  ro: { title: 'Bun venit la PRIMA', line: 'Deschideți aplicația PRIMA SECOND HOME (scanați codul QR) și introduceți acest cod și primele 3 litere ale numelui.', valid: 'Codul este valabil 14 zile.' },
  hu: { title: 'Üdvözöljük a PRIMA-ban', line: 'Nyissa meg a PRIMA SECOND HOME alkalmazást (QR-kód) és adja meg ezt a kódot és a vezetéknév első 3 betűjét.', valid: 'A kód 14 napig érvényes.' },
  vi: { title: 'Chào mừng đến PRIMA', line: 'Mở ứng dụng PRIMA SECOND HOME (quét mã QR) và nhập mã này cùng 3 chữ cái đầu của họ.', valid: 'Mã có hiệu lực 14 ngày.' },
  hi: { title: 'PRIMA में आपका स्वागत है', line: 'PRIMA SECOND HOME ऐप खोलें (QR स्कैन करें) और यह कोड तथा उपनाम के पहले 3 अक्षर डालें।', valid: 'कोड 14 दिन तक मान्य है।' },
  ne: { title: 'PRIMA मा स्वागत छ', line: 'PRIMA SECOND HOME एप खोल्नुहोस् (QR स्क्यान) र यो कोड तथा थरका पहिला ३ अक्षर हाल्नुहोस्।', valid: 'कोड १४ दिन मान्य छ।' },
  uz: { title: 'PRIMA’ga xush kelibsiz', line: 'PRIMA SECOND HOME ilovasini oching (QR skanerlang) va shu kodni hamda familiyaning dastlabki 3 harfini kiriting.', valid: 'Kod 14 kun amal qiladi.' },
  tl: { title: 'Maligayang pagdating sa PRIMA', line: 'Buksan ang PRIMA SECOND HOME app (i-scan ang QR) at ilagay ang code na ito at unang 3 letra ng apelyido.', valid: 'Balido ang code sa loob ng 14 araw.' },
};
export function slipLangs(lang) { return [...new Set([lang || 'en', 'sk', 'en', 'uk', 'ru'])].filter(l => SLIP_TEXT[l]).slice(0, 5); }
export function slipUrl(code) { return HOME_URL + '/#/welcome?step=code&c=' + encodeURIComponent(code); }
export function slipModel({ stay, code, property }) {
  return { code, url: slipUrl(code), property: property ? property.name : '', room: stay.room, name: stay.displayName || stay.display_name || '', langs: slipLangs(stay.lang), checkIn: stay.checkIn || stay.check_in || null };
}
export const STATUS_LABEL = { reported: 'Nahlásené', assigned: 'Priradené', inProgress: 'Rieši sa', longer: 'Dlhšia oprava', major: 'Väčšia porucha', deferred: 'Odložené', resolved: 'Vyriešené', ready: 'Pripravené', forwarded: 'Preposlané', received: 'Prijaté', cancelled: 'Zrušené' };
export const OFFICE_STATUSES = { service: ['assigned', 'inProgress', 'resolved', 'forwarded'], document: ['inProgress', 'ready', 'resolved'], private: ['received', 'inProgress', 'resolved'] };
export const KIND_LABEL = { issue: 'Porucha (RE SERVICE)', service: 'Služba', document: 'Doklad', private: 'Súkromné hlásenie' };
