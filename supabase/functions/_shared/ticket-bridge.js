// ZRKADLO src/domain/ticket-bridge.js pre edge runtime (bez importov z appky). Rovnaký výstup
// drží test/ticket-bridge-parity.test.mjs — pri zmene katalógu zmeň obe strany.
const CATEGORY = {
  walls: ['Steny', false, false], door: ['Dvere', false, false], window: ['Okná', false, false], floor: ['Podlaha', false, false],
  furniture: ['Nábytok', false, false], electric: ['Elektro (EI)', false, false], water: ['Voda/kúrenie (ZTI)', false, false],
  appliance: ['Spotrebiče', false, false], clean: ['Upratovanie / čistota', true, false], linen: ['Bielizeň', true, false],
  pests: ['Deratizácia', true, true], wifi: ['IT', false, false], noise: [null, false, false], other: ['Iné', false, false],
};
const PLACE_LABEL = { room: null, kitchen: 'Kuchyňa', bathroom: 'Toalety', corridor: 'Chodba poschodia', laundry: 'Práčovňa', outside: 'Exteriér', other: 'Iné' };
const PRIORITY = { low: 'Nízka', normal: 'Stredná', high: 'Vysoká' };
const CELL_COMMON_SUFFIX = 'bunka';
const RE_BUILDING_SPACES = ['Chodba poschodia', 'Schodisko', 'Kuchyňa', 'Práčovňa', 'Recepcia', 'Toalety', 'Fajčiareň', 'Exteriér', 'Sklad', 'Kotolňa', 'Serverovňa', 'Šatňa', 'Technický priestor', 'Iné'];
const RE_SPACE_KEY = { 'Chodba poschodia': 'chodba', 'Schodisko': 'schodisko', 'Kuchyňa': 'kuchyna', 'Práčovňa': 'pracovna', 'Recepcia': 'recepcia', 'Toalety': 'toalety', 'Fajčiareň': 'fajciaren', 'Exteriér': 'exterier', 'Sklad': 'sklad', 'Kotolňa': 'kotolna', 'Serverovňa': 'serverovna', 'Šatňa': 'satna', 'Technický priestor': 'technicka', 'Iné': 'ine' };

function parseCellRoom(code) { const s = String(code || '').trim(); const i = s.indexOf('/'); if (i <= 0) return { cell: null, sub: s || null }; return { cell: s.slice(0, i).trim() || null, sub: s.slice(i + 1).trim() || null }; }
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
export function roomCodeForRequest(req, stay) {
  const place = req.place && PLACE_LABEL[req.place] !== undefined ? req.place : 'room';
  if (place === 'room') return req.room || (stay && stay.room) || '';
  const no = String(req.roomOther || '').trim();
  return PLACE_LABEL[place] + (no ? ' ' + no : '');
}
export function buildTicketFromRequest(req, stay, property, { now = new Date() } = {}) {
  if (!req || req.kind !== 'issue') return null;
  const cat = CATEGORY[req.category] || CATEGORY.other;
  if (!cat[0]) return null;
  const room = roomCodeForRequest(req, stay);
  const desc = [req.text || '', req.textSk ? '[SK] ' + req.textSk : '', req.textEn ? '[EN] ' + req.textEn : ''].filter(Boolean).join('\n\n');
  return {
    id: 'G-' + req.id,
    propertyId: property ? property.id : (stay && stay.propertyId) || null,
    room, place: placeFromRoomCode(room),
    category: cat[0], forHousekeeping: !!cat[1], priority: PRIORITY[req.urgency] || PRIORITY.normal,
    status: 'Nahlásené', title: (req.textEn || req.text || cat[0]).slice(0, 80), description: desc,
    photos: req.photos || [], createdAt: now.toISOString(), createdBy: 'guest-app',
    source: { app: 'second-home', requestId: req.id, lang: req.lang || null, ddd: !!cat[2] },
  };
}
// Riadok tabuľky tickets v RE SERVICE (src/data/tickets-tb.js → ticketToRow): id + indexované stĺpce + celý objekt v data.
export function ticketToRow(ticket) {
  return { id: ticket.id, property_id: ticket.propertyId, status: ticket.status, for_housekeeping: !!ticket.forHousekeeping, project_id: null, created_at: ticket.createdAt, scheduled_for: null, updated_at: ticket.createdAt, data: ticket };
}
// Notifikácia pre personál v RE SERVICE (tabuľka notifications; roly podľa src/PrimaApp.jsx handleNewTicket).
export function staffNotification(ticket) {
  const hk = !!ticket.forHousekeeping;
  return { type: hk ? 'hk_new' : 'ticket_new', text: (hk ? 'Nové hlásenie hosťa (upratovanie): ' : 'Nové hlásenie hosťa: ') + ticket.room + ' · ' + ticket.category, ticketId: ticket.id,
    roles: hk ? ['Admin', 'Property Lead', 'Property Manager', 'Chyžná'] : ['Admin', 'Property Lead', 'Property Manager', 'Vedúci údržby', 'Údržbár'], propertyId: ticket.propertyId };
}
// Stav ticketu RE SERVICE → stav žiadosti hosťa (zrkadlo src/domain/request-status.js).
const STATUS_FROM_TICKET = { 'Nahlásené': 'reported', 'Priradené': 'assigned', 'Riešim': 'inProgress', 'Dlhšia oprava': 'longer', 'Veľká chyba': 'major', 'Odložené': 'deferred', 'Vyriešené': 'resolved' };
export function statusFromTicket(re) { return STATUS_FROM_TICKET[re] || 'reported'; }
