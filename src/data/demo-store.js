// DEMO úložisko nad localStorage. Rovnaké rozhranie ako budúci Supabase adaptér
// (src/data/adapter.js). Simuluje aj prácu personálu: staršie žiadosti sa posúvajú
// v stavoch, aby bolo v ukážke vidno priebeh (ageRequests).
import { DEMO_ANNOUNCEMENTS, DEMO_STAYS, demoBookingsFor, demoRequestsFor } from './seed.js';
import { enqueue, isOnline, registerHandler } from './outbox.js';

const KEY = 'primaHome:demo:v1';
const listeners = new Set();
let state = null;

function blank() { return { session: null, publicPropertyId: null, requests: [], readAnn: [], rulesAck: {}, feedback: [], seq: 1100, notifications: true, bookings: [], permits: {}, signatures: [], messages: [] }; }
function load() {
  if (state) return state;
  try { const raw = localStorage.getItem(KEY); state = raw ? { ...blank(), ...JSON.parse(raw) } : blank(); }
  catch { state = blank(); }
  return state;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  for (const fn of listeners) { try { fn(); } catch {} }
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const normSurname = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const MIN = 60 * 1000;
// Simulácia personálu: hlásenie → priradené po 1 min → rieši sa po 4 min → vyriešené po 12 min.
const FLOW = {
  issue:    [[1, 'assigned', null], [4, 'inProgress', { sk: 'Technik príde dnes medzi 13:00 a 15:00.', en: 'The technician will come today between 13:00 and 15:00.' }], [12, 'resolved', { sk: 'Opravené. Ak problém pretrváva, nahláste ho znova.', en: 'Fixed. If the problem continues, please report it again.' }]],
  service:  [[1, 'assigned', { sk: 'Recepcia potvrdila.', en: 'Reception confirmed.' }], [10, 'resolved', { sk: 'Hotové.', en: 'Done.' }]],
  document: [[2, 'inProgress', { sk: 'Pripravujeme.', en: 'Being prepared.' }], [8, 'ready', { sk: 'Pripravené na recepcii, prineste doklad.', en: 'Ready at reception — bring your ID.' }]],
  private:  [[2, 'received', { sk: 'Vedenie PRIMA hlásenie prijalo a preverí ho.', en: 'PRIMA management has received your report and will look into it.' }]],
};
function ageRequests() {
  const st = load();
  const now = Date.now();
  let changed = false;
  for (const r of st.requests) {
    if (r.demoSeeded || r.status === 'cancelled' || r.sync === 'queued') continue;   // neodoslané personál nevidí
    const base = r.syncedAt || r.createdAt;
    const flow = r.kind === 'service' && r.service === 'room' ? [[1, 'forwarded', { sk: 'Preposlané koordinátorovi vašej firmy.', en: 'Forwarded to your company coordinator.' }]] : (FLOW[r.kind] || []);
    const age = (now - new Date(base).getTime()) / MIN;
    for (const [mins, status, note] of flow) {
      if (age >= mins && !r.timeline.some(e => e.status === status)) {
        r.timeline.push({ at: new Date(new Date(base).getTime() + mins * MIN).toISOString(), status, note });
        r.status = status; r.updatedAt = new Date().toISOString(); changed = true;
      }
    }
  }
  if (changed) save();
}

// ── session ──
export function getSession() {
  const st = load();
  if (!st.session) return null;
  const stay = DEMO_STAYS.find(s => s.id === st.session.stayId) || null;
  return stay ? { stay } : null;
}
export function redeemCode(code, surname) {
  const c = normCode(code), s = normSurname(surname);
  const stay = DEMO_STAYS.find(x => normCode(x.code) === c);
  if (!stay || stay.surnamePrefix !== s) throw new Error('invalid');
  const st = load();
  st.session = { stayId: stay.id, at: new Date().toISOString() };
  if (!st.requests.some(r => r.stayId === stay.id)) st.requests.push(...demoRequestsFor(stay.id).map(r => ({ ...r, demoSeeded: true })));
  if (!st.bookings.some(b => b.stayId === stay.id)) st.bookings.push(...demoBookingsFor(stay.id));
  if (stay.permitExpiry && !st.permits[stay.id]) st.permits[stay.id] = stay.permitExpiry;
  save();
  return stay;
}
export function signOut() { const st = load(); st.session = null; save(); }
export function getPublicPropertyId() { return load().publicPropertyId; }
export function setPublicProperty(id) { const st = load(); st.publicPropertyId = id; save(); }

// ── requests ──
export function listRequests(stayId) {
  ageRequests();
  return load().requests.filter(r => r.stayId === stayId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export function getRequest(id) { ageRequests(); return load().requests.find(r => r.id === id) || null; }
export function createRequest(stayId, data) {
  const st = load();
  st.seq += 1;
  const now = new Date().toISOString();
  const req = { ...data, id: 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ref: 'H-' + st.seq, stayId,
    status: 'reported', createdAt: now, updatedAt: now, timeline: [{ at: now, status: 'reported' }],
    sync: isOnline() ? 'synced' : 'queued' };   // offline: uložené v telefóne, odošle outbox
  st.requests.push(req);
  save();
  if (req.sync === 'queued') enqueue('syncRequest', { id: req.id });
  return req;
}
export function cancelRequest(id) {
  const st = load();
  const r = st.requests.find(x => x.id === id);
  if (!r) return null;
  r.status = 'cancelled'; r.updatedAt = new Date().toISOString();
  r.timeline.push({ at: r.updatedAt, status: 'cancelled' });
  save();
  return r;
}

// ── announcements ──
export function listAnnouncements(propertyId) {
  const st = load();
  const now = Date.now();
  return DEMO_ANNOUNCEMENTS
    .filter(a => (!a.propertyId || a.propertyId === propertyId) && new Date(a.validFrom).getTime() <= now && new Date(a.validTo).getTime() >= now)
    .map(a => ({ ...a, unread: !st.readAnn.includes(a.id) }))
    .sort((a, b) => (a.severity === 'urgent' ? -1 : b.severity === 'urgent' ? 1 : a.validFrom < b.validFrom ? 1 : -1));
}
export function markAnnouncementsRead(ids) {
  const st = load();
  let changed = false;
  for (const id of ids) if (!st.readAnn.includes(id)) { st.readAnn.push(id); changed = true; }
  if (changed) save();
}

// ── laundry bookings / permit ──
export function listBookings(stayId) { return load().bookings.filter(b => b.stayId === stayId).sort((a, b) => (a.day + a.start < b.day + b.start ? -1 : 1)); }
export function createBooking(stayId, { day, start, len = 2, machine }) {
  const st = load();
  if (st.bookings.some(b => b.day === day && b.start === start && b.machine === machine && b.status !== 'cancelled')) throw new Error('taken');
  const b = { id: 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), stayId, day, start, len, machine, status: 'booked', createdAt: new Date().toISOString() };
  st.bookings.push(b); save();
  return b;
}
export function cancelBooking(id) { const st = load(); const b = st.bookings.find(x => x.id === id); if (!b) return null; b.status = 'cancelled'; save(); return b; }
export function getPermitExpiry(stayId) { return load().permits[stayId] || null; }
export function setPermitExpiry(stayId, iso) { const st = load(); if (iso) st.permits[stayId] = iso; else delete st.permits[stayId]; save(); }

// ── rules / feedback / prefs ──
export function getRulesAck(stayId) { return load().rulesAck[stayId] || null; }
export function ackRules(stayId, version) { const st = load(); st.rulesAck[stayId] = { version, at: new Date().toISOString() }; save(); }
export function submitFeedback(stayId, data) { const st = load(); st.feedback.push({ ...data, stayId: data.anonymous ? null : stayId, at: new Date().toISOString() }); save(); }
export function getNotificationsPref() { return load().notifications !== false; }
export function setNotificationsPref(v) { const st = load(); st.notifications = !!v; save(); }
export function resetDemo() { state = blank(); save(); }

// ── podpis poriadku (PDF vyrobené v telefóne), fotky, správy s recepciou ──
export function listSignatures(stayId) { return load().signatures.filter(x => x.stayId === stayId).sort((a, b) => (a.signedAt < b.signedAt ? 1 : -1)); }
export function signRules(stayId, { version, name, email, lang, pdfDataUrl, sha256 }) {
  const st = load();
  const sig = { id: 'sig_' + Date.now().toString(36), stayId, version, name: name || null, email: email || null, lang: lang || null, signedAt: new Date().toISOString(), pdfDataUrl: pdfDataUrl || null, sha256: sha256 || null, sync: 'synced' };
  st.signatures = st.signatures.filter(x => !(x.stayId === stayId && x.version === version));   // nový podpis nahrádza starý pre tú istú verziu
  st.signatures.push(sig);
  st.rulesAck[stayId] = { version, at: sig.signedAt, signatureId: sig.id };
  save();
  return sig;
}
export async function getDocumentUrl(sig) { return sig && sig.pdfDataUrl ? sig.pdfDataUrl : null; }
export async function getPhotoUrls(req) { return (req && req.photos) || []; }
const DEMO_REPLY = { sk: 'Ďakujeme za správu. Recepcia sa vám ozve do 30 minút.', en: 'Thank you for your message. Reception will reply within 30 minutes.' };
export function listMessages(stayId) { return load().messages.filter(m => m.stayId === stayId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)); }
export function sendMessage(stayId, text, lang) {
  const st = load();
  const body = String(text || '').trim().slice(0, 2000);
  if (!body) return null;
  const now = new Date().toISOString();
  const m = { id: 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), stayId, sender: 'guest', text: body, tr: {}, lang: lang || null, createdAt: now, readAt: now, sync: 'synced' };
  st.messages.push(m);
  // ukážková odpoveď recepcie o pár sekúnd (v ostrej prevádzke odpovedá recepcia z TOOLS, preklad DeepL)
  st.messages.push({ id: m.id + '_r', stayId, sender: 'reception', text: DEMO_REPLY.sk, tr: DEMO_REPLY, lang: 'sk', createdAt: new Date(Date.now() + 4000).toISOString(), readAt: null, sync: 'synced' });
  save();
  return m;
}
export function markMessagesRead(stayId) {
  const st = load(); let changed = false; const at = new Date().toISOString();
  for (const m of st.messages) if (m.stayId === stayId && m.sender === 'reception' && !m.readAt && m.createdAt <= at) { m.readAt = at; changed = true; }
  if (changed) save();
}
export function start() {}

// Outbox: v DEMO režime je „odoslanie“ = označiť žiadosť ako odoslanú (Supabase adaptér v1.1 tu
// spraví skutočný zápis). Simulácia personálu beží až od odoslania (syncedAt), nie od uloženia.
registerHandler('syncRequest', async ({ id }) => {
  const st = load();
  const r = st.requests.find(x => x.id === id);
  if (!r || r.sync === 'synced') return;
  r.sync = 'synced'; r.syncedAt = new Date().toISOString(); r.updatedAt = r.syncedAt;
  save();
});
