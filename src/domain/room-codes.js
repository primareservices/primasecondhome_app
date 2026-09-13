// Kódy izieb — podmnožina z PRIMA RE SERVICE (src/domain/room-codes.js, src/qr/payload.js),
// aby hlásenie z aplikácie hostí mierilo na TEN ISTÝ kód izby ako tickety údržby.
// '001/3' = bunka 001, izba 3 · 'B003' = blok B (Tarif) · '325' = samostatná izba.
export const CELL_COMMON_SUFFIX = 'bunka';

export function parseCellRoom(code) {
  const s = String(code || '').trim();
  const i = s.indexOf('/');
  if (i <= 0) return { cell: null, sub: s || null };
  return { cell: s.slice(0, i).trim() || null, sub: s.slice(i + 1).trim() || null };
}
export function cellOfRoom(code) { return parseCellRoom(code).cell; }
export function roomLabel(code) {
  if (!code) return '';
  const s = String(code);
  return s.endsWith('/' + CELL_COMMON_SUFFIX) ? s.slice(0, -(CELL_COMMON_SUFFIX.length + 1)) : s;
}
export function parseRoomLoc(room) {
  const m = String(room || '').trim().match(/^([A-Za-z])?\s*(\d+)/);
  if (!m) return { block: null, floor: null };
  const block = m[1] ? m[1].toUpperCase() : null;
  const digits = m[2];
  const floor = digits.length >= 3 ? String(parseInt(digits.slice(0, digits.length - 2), 10)) : null;
  return { block, floor };
}
// QR štítok na dverách: https://service.primare.sk/?qr=IC23:111/2 → { pid:'IC23', room:'111/2' }
export function parseQrPayload(raw) {
  let v = String(raw || '').trim();
  if (!v) return null;
  const m = v.match(/[?&]qr=([^&#\s]+)/i);
  if (m) v = m[1];
  else if (v.indexOf('://') >= 0) return null;
  if (/%[0-9A-Fa-f]{2}/.test(v)) { try { v = decodeURIComponent(v); } catch (e) {} }
  v = v.trim();
  const i = v.indexOf(':');
  if (i <= 0) return null;
  const pid = v.slice(0, i).trim();
  const room = v.slice(i + 1).trim();
  if (!pid || !room) return null;
  return { pid, room };
}

// Ručne zadaný kód izby (hlásenie „inde“): 'b 214' → 'B214', '111 / 2' → '111/2', '111/BUNKA' → '111/bunka'.
export function normalizeRoomCode(input) {
  let s = String(input || '').trim().replace(/\s+/g, '').replace(/[\\–—]/g, '/');
  if (!s) return '';
  const i = s.indexOf('/');
  if (i > 0) {
    const sub = s.slice(i + 1);
    s = s.slice(0, i).toUpperCase() + '/' + (sub.toLowerCase() === CELL_COMMON_SUFFIX ? CELL_COMMON_SUFFIX : sub.toUpperCase());
  } else s = s.toUpperCase();
  return s;
}
// Vyzerá to ako kód izby podľa pravidiel RE SERVICE? (blok A/B/C + 1–4 číslice, voliteľne /izba alebo /bunka)
export function isRoomCode(code) {
  return /^[A-Z]?\d{1,4}(\/(\d{1,2}[A-Z]?|bunka))?$/.test(String(code || ''));
}
// Popis pre hosťa na potvrdenie: { cell, sub, common, block, floor } alebo null, keď to nie je kód.
export function describeRoom(code) {
  if (!isRoomCode(code)) return null;
  const { cell, sub } = parseCellRoom(code);
  const { block, floor } = parseRoomLoc(code);
  return { cell, sub: sub === CELL_COMMON_SUFFIX ? null : sub, common: sub === CELL_COMMON_SUFFIX, block, floor };
}
