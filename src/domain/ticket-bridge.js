// Prevod hlásenia hosťa na ticket PRIMA RE SERVICE (tvar podľa jeho
// src/data/tickets-tb.js → ticketToRow: celý objekt ide do stĺpca `data`).
// Beží na serveri (edge funkcia guest-request-bridge), tu je čistá logika bez siete,
// aby sa dala otestovať (test/ticket-bridge.test.mjs).
import { ISSUE_BY_KEY, PLACES, URGENCY } from '../config/catalog.js';
import { CELL_COMMON_SUFFIX, parseCellRoom } from './room-codes.js';

const RE_BUILDING_SPACES = ['Chodba poschodia', 'Schodisko', 'Kuchyňa', 'Práčovňa', 'Recepcia', 'Toalety', 'Fajčiareň', 'Exteriér', 'Sklad', 'Kotolňa', 'Serverovňa', 'Šatňa', 'Technický priestor', 'Iné'];
const RE_SPACE_KEY = { 'Chodba poschodia': 'chodba', 'Schodisko': 'schodisko', 'Kuchyňa': 'kuchyna', 'Práčovňa': 'pracovna', 'Recepcia': 'recepcia', 'Toalety': 'toalety', 'Fajčiareň': 'fajciaren', 'Exteriér': 'exterier', 'Sklad': 'sklad', 'Kotolňa': 'kotolna', 'Serverovňa': 'serverovna', 'Šatňa': 'satna', 'Technický priestor': 'technicka', 'Iné': 'ine' };

// Zrkadlo placeFromRoomCode z RE SERVICE (src/qr/payload.js).
export function placeFromRoomCode(code) {
  const s = String(code || '').trim();
  if (!s) return null;
  const { cell, sub } = parseCellRoom(s);
  if (cell && String(sub || '').toLowerCase() === CELL_COMMON_SUFFIX) return { type: 'cell', cell, room: null, space: null, roomNo: null };
  for (const label of RE_BUILDING_SPACES) {
    if (s === label || s.startsWith(label + ' ')) return { type: 'building', cell: null, room: null, space: RE_SPACE_KEY[label], roomNo: s.slice(label.length).trim() || null };
  }
  return { type: 'room', cell, room: cell ? sub : s, space: null, roomNo: null };
}

// Miesto hlásenia → kód izby / label spoločného priestoru tak, ako ho pozná RE SERVICE.
export function roomCodeForRequest(req, stay) {
  const place = PLACES.find(p => p.key === req.place) || PLACES[0];
  if (place.key === 'room') return req.room || (stay && stay.room) || '';
  const no = String(req.roomOther || '').trim();
  return place.reLabel + (no ? ' ' + no : '');
}

export function buildTicketFromRequest(req, stay, property, { now = new Date() } = {}) {
  if (!req || req.kind !== 'issue') return null;
  const cat = ISSUE_BY_KEY[req.category] || ISSUE_BY_KEY.other;
  if (!cat.re) return null;   // hluk / správanie → recepcia, nie ticket
  const urg = URGENCY.find(u => u.key === req.urgency) || URGENCY[1];
  const room = roomCodeForRequest(req, stay);
  const desc = [req.text || '', req.textSk ? '[SK] ' + req.textSk : '', req.textEn ? '[EN] ' + req.textEn : ''].filter(Boolean).join('\n\n');
  return {
    id: 'G-' + req.id,
    propertyId: property ? property.id : (stay && stay.propertyId) || null,
    room,
    place: placeFromRoomCode(room),
    category: cat.re,
    forHousekeeping: !!cat.hk,
    priority: urg.priority,
    status: 'Nahlásené',
    title: (req.textEn || req.text || cat.re).slice(0, 80),
    description: desc,
    photos: req.photos || [],
    createdAt: now.toISOString(),
    createdBy: 'guest-app',
    source: { app: 'second-home', requestId: req.id, lang: req.lang || null, ddd: !!cat.ddd },
  };
}
