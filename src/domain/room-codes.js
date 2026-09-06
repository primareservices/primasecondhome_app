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
