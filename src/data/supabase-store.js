// Supabase adaptér (v1.1): ROVNAKÉ synchrónne rozhranie ako demo-store.js nad lokálnou cache,
// server je zdroj pravdy. Čítania idú z cache (okamžité UI aj offline), zápisy sa hneď premietnu
// do cache a odošlú cez outbox (src/data/outbox.js); sync ťahá zmeny zo servera pri štarte,
// po návrate online, pri prepnutí do appky, každú minútu a po každom odoslaní.
// Tvary objektov sú tie isté ako v demo-store — obrazovky sa nemenia.
import { APP_VERSION } from '../config/app-config.js';
import { SupaError, clearSession, ensureSession, getUid, rest, rpc, signedUrl, uploadDataUrl } from './supabase-client.js';
import { enqueue, flush, isOnline, registerHandler } from './outbox.js';
import { normSurname } from './demo-store.js';

const KEY = 'primaHome:cache:v1';
const SYNC_MIN_MS = 20 * 1000;
const listeners = new Set();
const mem = {};
let state = null;
let syncing = null;
let lastSync = 0;
let started = false;

function storage() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch {}
  return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
}
function blank() {
  return { session: null, stay: null, publicPropertyId: null, requests: [], photosLocal: {}, announcements: [], readAnn: [], rulesAck: {},
    bookings: [], occupancy: [], permits: {}, prefs: { notifications: true }, signatures: [], messages: [], syncedAt: null };
}
function load() {
  if (state) return state;
  try { const raw = storage().getItem(KEY); state = raw ? { ...blank(), ...JSON.parse(raw) } : blank(); } catch { state = blank(); }
  return state;
}
function save() {
  try { storage().setItem(KEY, JSON.stringify(state)); } catch {}
  for (const fn of listeners) { try { fn(); } catch {} }
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
const nowISO = () => new Date().toISOString();
const dayISO = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

// ── mapovanie riadkov servera na tvary appky ─────────────────────────────────
const PAYLOAD_KEYS = ['roomOther', 'roomCode', 'urgency', 'bags', 'slot', 'plate', 'cardReason', 'roomReason', 'note', 'purpose', 'passport', 'neededBy', 'pickup', 'anonymous', 'contact', 'route', 'doc'];
export function stayFromRow(r) {
  if (!r) return null;
  return { id: r.id, propertyId: r.property_id, room: r.room, displayName: r.display_name, company: r.client_company, coordinator: r.coordinator || null,
    checkIn: r.check_in, checkOut: r.check_out, registeredAt: r.registered_at, lang: r.lang, email: r.email || null };
}
export function requestFromRow(r, photosLocal) {
  const local = photosLocal && photosLocal[r.id];
  return { ...(r.payload || {}), id: r.id, ref: r.ref, stayId: r.stay_id, kind: r.kind, category: r.category, service: r.service, place: r.place, room: r.room,
    text: r.text, lang: r.lang, status: r.status, timeline: Array.isArray(r.timeline) ? r.timeline : [], createdAt: r.created_at, updatedAt: r.updated_at,
    externalRef: r.external_ref || null, photos: local || [], photoPaths: Array.isArray(r.photos) ? r.photos : [], sync: 'synced' };
}
export function requestToRow(req) {
  const payload = {}; for (const k of PAYLOAD_KEYS) if (req[k] !== undefined) payload[k] = req[k];
  return { id: req.id, stay_id: req.stayId, kind: req.kind, category: req.category || null, service: req.service || null, place: req.place || null, room: req.room || null,
    payload, photos: req.photoPaths || [], text: req.text || req.note || null, lang: req.lang || null, status: 'reported', timeline: req.timeline || [], created_at: req.createdAt };
}
const annFromRow = (r, readAnn) => ({ id: r.id, propertyId: r.property_id, severity: r.severity, validFrom: r.valid_from, validTo: r.valid_to, texts: r.texts || {}, scope: r.scope || {}, unread: !readAnn.includes(r.id) });
const bookingFromRow = (r) => ({ id: r.id, stayId: r.stay_id, day: r.day, start: r.start, len: r.len, machine: r.machine, status: r.status, createdAt: r.created_at });
const msgFromRow = (r) => ({ id: r.id, stayId: r.stay_id, sender: r.sender, text: r.text, tr: r.tr || {}, lang: r.lang, createdAt: r.created_at, readAt: r.read_at });
const sigFromRow = (r) => ({ id: r.id, stayId: r.stay_id, version: r.version, name: r.name, email: r.email, lang: r.lang, signedAt: r.signed_at, pdfPath: r.pdf_path, sha256: r.sha256, emailSentAt: r.email_sent_at, sync: 'synced' });

// ── session ──────────────────────────────────────────────────────────────────
export function getSession() { const st = load(); return st.session && st.stay ? { stay: st.stay } : null; }
export async function redeemCode(code, surname) {
  await ensureSession();
  let row;
  try { row = await rpc('redeem_code', { p_code: String(code || ''), p_surname: normSurname(surname) }); }
  catch (e) { if (e instanceof SupaError && /too_many/.test(e.message)) throw new Error('too_many_attempts'); throw e; }
  if (Array.isArray(row)) row = row[0];
  if (!row || !row.id) throw new Error('invalid');
  const stay = stayFromRow(row);
  const st = load();
  st.session = { stayId: stay.id, at: nowISO() }; st.stay = stay;
  save();
  syncAll(true).catch(() => {});
  return stay;
}
export function signOut() {
  state = blank(); save();
  clearSession();   // nový anonymný používateľ pri ďalšom prihlásení; väzbu zmaže guest_cleanup
}
export function getPublicPropertyId() { return load().publicPropertyId; }
export function setPublicProperty(id) { const st = load(); st.publicPropertyId = id; save(); syncAll(true).catch(() => {}); }

// ── žiadosti ─────────────────────────────────────────────────────────────────
export function listRequests(stayId) { return load().requests.filter(r => r.stayId === stayId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); }
export function getRequest(id) { return load().requests.find(r => r.id === id) || null; }
export function createRequest(stayId, data) {
  const st = load();
  const now = nowISO();
  const id = uuid();
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const req = { ...data, id, ref: '…', stayId, status: 'reported', createdAt: now, updatedAt: now, timeline: [{ at: now, status: 'reported' }], photos, photoPaths: [], sync: 'queued' };
  st.requests.push(req);
  if (photos.length) { st.photosLocal[id] = photos; prunePhotos(st); }
  save();
  enqueue('supa:insertRequest', { id });
  if (isOnline()) flush().catch(() => {});
  return req;
}
export function cancelRequest(id) {
  const st = load();
  const r = st.requests.find(x => x.id === id);
  if (!r) return null;
  r.status = 'cancelled'; r.updatedAt = nowISO(); r.timeline.push({ at: r.updatedAt, status: 'cancelled' });
  save();
  enqueue('supa:cancelRequest', { id });
  if (isOnline()) flush().catch(() => {});
  return r;
}
function prunePhotos(st) {
  const keep = st.requests.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 10).map(r => r.id);
  for (const id of Object.keys(st.photosLocal)) if (!keep.includes(id)) delete st.photosLocal[id];
}
export async function getPhotoUrls(req) {
  if (req && req.photos && req.photos.length) return req.photos;
  if (!req || !req.photoPaths || !req.photoPaths.length) return [];
  return Promise.all(req.photoPaths.map(p => signedUrl('guest-photos', p, 3600).catch(() => null))).then(a => a.filter(Boolean));
}

// ── oznamy ───────────────────────────────────────────────────────────────────
export function listAnnouncements(propertyId) {
  const st = load();
  const now = Date.now();
  return st.announcements
    .filter(a => (!a.propertyId || a.propertyId === propertyId) && new Date(a.validFrom).getTime() <= now && (!a.validTo || new Date(a.validTo).getTime() >= now))
    .map(a => ({ ...a, unread: !st.readAnn.includes(a.id) }))
    .sort((a, b) => (a.severity === 'urgent' ? -1 : b.severity === 'urgent' ? 1 : a.validFrom < b.validFrom ? 1 : -1));
}
export function markAnnouncementsRead(ids) {
  const st = load();
  const fresh = ids.filter(id => !st.readAnn.includes(id));
  if (!fresh.length) return;
  st.readAnn.push(...fresh); save();
  enqueue('supa:markRead', { ids: fresh });
  if (isOnline()) flush().catch(() => {});
}

// ── práčovňa ─────────────────────────────────────────────────────────────────
// Vlastné rezervácie + obsadenosť ostatných (foreign: true, bez mien) — availability() ich číta spolu.
export function listBookings(stayId) {
  const st = load();
  const mine = st.bookings.filter(b => b.stayId === stayId);
  const foreign = st.occupancy.filter(o => !mine.some(b => b.day === o.day && b.start === o.start && b.machine === o.machine && b.status !== 'cancelled'))
    .map(o => ({ ...o, status: 'booked', foreign: true }));
  return [...mine, ...foreign].sort((a, b) => (a.day + a.start < b.day + b.start ? -1 : 1));
}
// Rezervácia sa overuje na serveri hneď (konflikt = 'taken'); offline nejde.
export async function createBooking(stayId, { day, start, len = 2, machine }) {
  if (!isOnline()) throw new Error('offline');
  const st = load();
  if (st.bookings.some(b => b.stayId === stayId && b.day === day && b.start === start && b.machine === machine && b.status !== 'cancelled')) throw new Error('taken');
  const id = uuid();
  let rows;
  try { rows = await rest('guest_bookings', { method: 'POST', body: { id, stay_id: stayId, day, start, len, machine }, prefer: 'return=representation' }); }
  catch (e) { if (e instanceof SupaError && (e.code === '23505' || e.status === 409)) throw new Error('taken'); throw e; }
  const b = bookingFromRow(Array.isArray(rows) ? rows[0] : rows);
  st.bookings.push(b); save();
  return b;
}
export function cancelBooking(id) {
  const st = load();
  const b = st.bookings.find(x => x.id === id);
  if (!b) return null;
  b.status = 'cancelled'; save();
  enqueue('supa:cancelBooking', { id });
  if (isOnline()) flush().catch(() => {});
  return b;
}
export function getPermitExpiry(stayId) { return load().permits[stayId] || null; }
export function setPermitExpiry(stayId, iso) {
  const st = load();
  if (iso) st.permits[stayId] = iso; else delete st.permits[stayId];
  save();
  enqueue('supa:setPermit', { stayId, expiry: iso || null });
  if (isOnline()) flush().catch(() => {});
}

// ── pravidlá / spätná väzba / nastavenia ─────────────────────────────────────
export function getRulesAck(stayId) { return load().rulesAck[stayId] || null; }
export function ackRules(stayId, version) {
  const st = load();
  st.rulesAck[stayId] = { version, at: nowISO() }; save();
  enqueue('supa:ackRules', { stayId, version });
  if (isOnline()) flush().catch(() => {});
}
export function submitFeedback(stayId, data) {
  const st = load();
  const item = { ...data, stayId: data.anonymous ? null : stayId, propertyId: st.stay ? st.stay.propertyId : st.publicPropertyId, at: nowISO() };
  enqueue('supa:feedback', item);
  if (isOnline()) flush().catch(() => {});
}
export function getNotificationsPref() { return load().prefs.notifications !== false; }
export function setNotificationsPref(v) {
  const st = load();
  st.prefs.notifications = !!v; save();
  enqueue('supa:setPrefs', { notifications: !!v, lang: st.stay ? st.stay.lang : null });
  if (isOnline()) flush().catch(() => {});
}
export function resetDemo() { state = blank(); save(); }

// ── správy s recepciou ───────────────────────────────────────────────────────
export function listMessages(stayId) { return load().messages.filter(m => m.stayId === stayId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)); }
export function sendMessage(stayId, text, lang) {
  const st = load();
  const m = { id: uuid(), stayId, sender: 'guest', text: String(text || '').trim().slice(0, 2000), tr: {}, lang: lang || null, createdAt: nowISO(), readAt: null, sync: 'queued' };
  if (!m.text) return null;
  st.messages.push(m); save();
  enqueue('supa:insertMessage', { id: m.id });
  if (isOnline()) flush().catch(() => {});
  return m;
}
export function markMessagesRead(stayId) {
  const st = load();
  const ids = st.messages.filter(m => m.stayId === stayId && m.sender === 'reception' && !m.readAt).map(m => m.id);
  if (!ids.length) return;
  const at = nowISO();
  for (const m of st.messages) if (ids.includes(m.id)) m.readAt = at;
  save();
  enqueue('supa:markMessagesRead', { ids });
  if (isOnline()) flush().catch(() => {});
}

// ── podpis ubytovacieho poriadku ─────────────────────────────────────────────
export function listSignatures(stayId) { return load().signatures.filter(s => s.stayId === stayId).sort((a, b) => (a.signedAt < b.signedAt ? 1 : -1)); }
// PDF vyrobí server (edge funkcia sign-rules); kým nepríde, hosť vidí lokálnu verziu z telefónu (pdfDataUrl).
export function signRules(stayId, { version, name, email, lang, signaturePng, pdfDataUrl, sha256 }) {
  const st = load();
  const sig = { id: uuid(), stayId, version, name: name || null, email: email || null, lang: lang || null, signedAt: nowISO(), pdfPath: null, sha256: sha256 || null, pdfDataUrl: pdfDataUrl || null, sync: 'queued' };
  st.signatures.push(sig);
  st.rulesAck[stayId] = { version, at: sig.signedAt, signatureId: sig.id };
  if (signaturePng) st.photosLocal['sig:' + sig.id] = [signaturePng];
  save();
  enqueue('supa:insertSignature', { id: sig.id });
  enqueue('supa:ackRules', { stayId, version });
  if (isOnline()) flush().catch(() => {});
  return sig;
}
export async function getDocumentUrl(sig) {
  if (sig && sig.pdfPath) { try { return await signedUrl('guest-docs', sig.pdfPath, 3600); } catch {} }
  return sig && sig.pdfDataUrl ? sig.pdfDataUrl : null;
}

// ── sync zo servera ──────────────────────────────────────────────────────────
async function fetchAll(path) { const rows = await rest(path); return Array.isArray(rows) ? rows : []; }
export async function syncAll(force = false) {
  if (syncing) return syncing;
  if (!force && Date.now() - lastSync < SYNC_MIN_MS) return null;
  if (!isOnline()) return null;
  syncing = (async () => {
    const st = load();
    const pid = st.stay ? st.stay.propertyId : st.publicPropertyId;
    const uid = getUid();
    const jobs = {};
    if (pid) jobs.ann = fetchAll('guest_announcements?select=*&or=(property_id.is.null,property_id.eq.' + encodeURIComponent(pid) + ')&order=valid_from.desc');
    if (st.stay) {
      const sid = st.stay.id;
      const from = dayISO(new Date()), to = dayISO(new Date(Date.now() + 8 * 864e5));
      jobs.stay = rest('guest_stays?select=*&id=eq.' + sid);
      jobs.requests = fetchAll('guest_requests?select=*&stay_id=eq.' + sid + '&order=created_at.desc&limit=200');
      jobs.bookings = fetchAll('guest_bookings?select=*&stay_id=eq.' + sid + '&day=gte.' + from + '&order=day.asc');
      jobs.occupancy = rpc('laundry_occupancy', { p_property: st.stay.propertyId, p_from: from, p_to: to });
      jobs.permits = fetchAll('guest_permits?select=*&stay_id=eq.' + sid);
      jobs.acks = fetchAll('rule_acks?select=*&stay_id=eq.' + sid + '&order=at.desc&limit=1');
      jobs.messages = fetchAll('guest_messages?select=*&stay_id=eq.' + sid + '&order=created_at.asc&limit=200');
      jobs.signatures = fetchAll('guest_signatures?select=*&stay_id=eq.' + sid + '&order=signed_at.desc');
    }
    if (uid) { jobs.reads = fetchAll('guest_ann_reads?select=ann_id&uid=eq.' + uid); jobs.prefs = fetchAll('guest_prefs?select=*&uid=eq.' + uid); }
    const keys = Object.keys(jobs);
    const results = await Promise.allSettled(keys.map(k => jobs[k]));
    const got = {}; keys.forEach((k, i) => { if (results[i].status === 'fulfilled') got[k] = results[i].value; });
    const s2 = load();
    if (got.stay) { const row = Array.isArray(got.stay) ? got.stay[0] : got.stay; if (row) s2.stay = stayFromRow(row); else if (s2.stay) { /* pobyt zmizol (anonymizovaný) */ s2.session = null; s2.stay = null; } }
    if (got.reads) s2.readAnn = got.reads.map(r => r.ann_id);
    if (got.ann) s2.announcements = got.ann.map(r => annFromRow(r, s2.readAnn));
    if (got.requests) {
      const queued = s2.requests.filter(r => r.sync !== 'synced' && !got.requests.some(x => x.id === r.id));
      s2.requests = [...got.requests.map(r => requestFromRow(r, s2.photosLocal)), ...queued];
    }
    if (got.bookings) { const queued = s2.bookings.filter(b => !got.bookings.some(x => x.id === b.id) && b.day >= dayISO(new Date())); s2.bookings = [...got.bookings.map(bookingFromRow), ...queued]; }
    if (got.occupancy) s2.occupancy = (Array.isArray(got.occupancy) ? got.occupancy : []).map(o => ({ day: o.day, start: o.start, len: o.len, machine: o.machine }));
    if (got.permits && s2.stay) { const p = got.permits[0]; if (p && p.expiry) s2.permits[s2.stay.id] = p.expiry; }
    if (got.acks && s2.stay && got.acks[0]) s2.rulesAck[s2.stay.id] = { version: got.acks[0].version, at: got.acks[0].at };
    if (got.messages) { const queued = s2.messages.filter(m => m.sync === 'queued' && !got.messages.some(x => x.id === m.id)); s2.messages = [...got.messages.map(msgFromRow), ...queued]; }
    if (got.signatures) {
      const local = Object.fromEntries(s2.signatures.map(s => [s.id, s]));
      const queued = s2.signatures.filter(s => s.sync === 'queued' && !got.signatures.some(x => x.id === s.id));
      s2.signatures = [...got.signatures.map(r => ({ ...sigFromRow(r), pdfDataUrl: local[r.id] ? local[r.id].pdfDataUrl : null })), ...queued];
    }
    if (got.prefs && got.prefs[0]) s2.prefs.notifications = got.prefs[0].notifications !== false;
    s2.syncedAt = nowISO();
    lastSync = Date.now();
    save();
    return true;
  })().finally(() => { syncing = null; });
  return syncing;
}
export function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => { flush().then(() => syncAll(true)).catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncAll().catch(() => {}); });
  setInterval(() => syncAll().catch(() => {}), 60 * 1000);
  syncAll(true).catch(() => {});
}

// ── outbox handlery: zápisy na server ────────────────────────────────────────
function patchLocal(list, id, fn) { const st = load(); const x = list(st).find(i => i.id === id); if (x) { fn(x, st); save(); } }
registerHandler('supa:insertRequest', async ({ id }) => {
  const st = load();
  const req = st.requests.find(r => r.id === id);
  if (!req || req.sync === 'synced') return;
  // fotky: dátové URL z telefónu → privátny bucket guest-photos/<stay>/<žiadosť>/<n>.jpg
  const paths = req.photoPaths ? req.photoPaths.slice() : [];
  const local = st.photosLocal[id] || req.photos || [];
  for (let i = paths.length; i < local.length; i++) {
    const p = req.stayId + '/' + id + '/' + (i + 1) + '.jpg';
    await uploadDataUrl('guest-photos', p, local[i]);
    paths.push(p); req.photoPaths = paths; save();
  }
  let rows;
  try { rows = await rest('guest_requests?on_conflict=id', { method: 'POST', body: requestToRow(req), prefer: 'resolution=ignore-duplicates,return=representation' }); }
  catch (e) { if (e && e.permanent) patchLocal(s => s.requests, id, r => { r.sync = 'failed'; r.syncError = e.message; }); throw e; }
  const row = Array.isArray(rows) ? rows[0] : rows;
  patchLocal(s => s.requests, id, (r, s) => { if (row) { Object.assign(r, requestFromRow(row, s.photosLocal)); } r.sync = 'synced'; r.syncedAt = nowISO(); });
});
registerHandler('supa:cancelRequest', async ({ id }) => { await rest('guest_requests?id=eq.' + id, { method: 'PATCH', body: { status: 'cancelled' }, prefer: 'return=minimal' }); });
registerHandler('supa:cancelBooking', async ({ id }) => { await rest('guest_bookings?id=eq.' + id, { method: 'PATCH', body: { status: 'cancelled', cancelled_at: nowISO() }, prefer: 'return=minimal' }); });
registerHandler('supa:setPermit', async ({ stayId, expiry }) => {
  if (expiry) await rest('guest_permits?on_conflict=stay_id', { method: 'POST', body: { stay_id: stayId, expiry, updated_at: nowISO() }, prefer: 'resolution=merge-duplicates,return=minimal' });
  else await rest('guest_permits?stay_id=eq.' + stayId, { method: 'DELETE', prefer: 'return=minimal' });
});
registerHandler('supa:ackRules', async ({ stayId, version }) => {
  const uid = getUid(); if (!uid) throw new Error('no_uid');
  await rest('rule_acks?on_conflict=uid,stay_id,version', { method: 'POST', body: { uid, stay_id: stayId, version }, prefer: 'resolution=ignore-duplicates,return=minimal' });
});
registerHandler('supa:markRead', async ({ ids }) => {
  const uid = getUid(); if (!uid) throw new Error('no_uid');
  await rest('guest_ann_reads?on_conflict=uid,ann_id', { method: 'POST', body: ids.map(id => ({ uid, ann_id: id })), prefer: 'resolution=ignore-duplicates,return=minimal' });
});
registerHandler('supa:setPrefs', async ({ notifications, lang }) => {
  const uid = getUid(); if (!uid) throw new Error('no_uid');
  await rest('guest_prefs?on_conflict=uid', { method: 'POST', body: { uid, notifications, lang, updated_at: nowISO() }, prefer: 'resolution=merge-duplicates,return=minimal' });
});
registerHandler('supa:feedback', async (item) => {
  await rest('guest_feedback', { method: 'POST', body: { stay_id: item.stayId, property_id: item.propertyId, ratings: item.ratings || {}, text: item.text || null, lang: item.lang || null }, prefer: 'return=minimal' });
});
registerHandler('supa:insertMessage', async ({ id }) => {
  const m = load().messages.find(x => x.id === id);
  if (!m || m.sync === 'synced') return;
  await rest('guest_messages?on_conflict=id', { method: 'POST', body: { id: m.id, stay_id: m.stayId, sender: 'guest', text: m.text, lang: m.lang, created_at: m.createdAt }, prefer: 'resolution=ignore-duplicates,return=minimal' });
  patchLocal(s => s.messages, id, x => { x.sync = 'synced'; });
});
registerHandler('supa:markMessagesRead', async ({ ids }) => {
  await rest('guest_messages?id=in.(' + ids.join(',') + ')', { method: 'PATCH', body: { read_at: nowISO() }, prefer: 'return=minimal' });
});
registerHandler('supa:insertSignature', async ({ id }) => {
  const st = load();
  const sig = st.signatures.find(x => x.id === id);
  if (!sig || sig.sync === 'synced') return;
  const png = (st.photosLocal['sig:' + id] || [])[0];
  let signature_path = null;
  if (png) { signature_path = sig.stayId + '/signature-' + id + '.png'; await uploadDataUrl('guest-docs', signature_path, png); }
  const audit = { app_version: APP_VERSION, ua: typeof navigator !== 'undefined' ? navigator.userAgent : null, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, sha256_local: sig.sha256 || null };
  await rest('guest_signatures?on_conflict=id', { method: 'POST', body: { id: sig.id, stay_id: sig.stayId, version: sig.version, name: sig.name, email: sig.email, lang: sig.lang, signature_path, audit, signed_at: sig.signedAt }, prefer: 'resolution=ignore-duplicates,return=minimal' });
  patchLocal(s => s.signatures, id, x => { x.sync = 'synced'; });
  delete load().photosLocal['sig:' + id]; save();
});

// ── push predplatné ──────────────────────────────────────────────────────────
export function savePushSubscription(sub) { if (!sub || !sub.endpoint) return; enqueue('supa:pushSave', { endpoint: sub.endpoint, keys: sub.keys || {} }); if (isOnline()) flush().catch(() => {}); }
export function removePushSubscription(endpoint) { if (!endpoint) return; enqueue('supa:pushRemove', { endpoint }); if (isOnline()) flush().catch(() => {}); }
registerHandler('supa:pushSave', async ({ endpoint, keys }) => {
  const uid = getUid(); if (!uid) throw new Error('no_uid');
  await rest('guest_push_subscriptions?on_conflict=uid,endpoint', { method: 'POST', body: { uid, endpoint, keys }, prefer: 'resolution=merge-duplicates,return=minimal' });
});
registerHandler('supa:pushRemove', async ({ endpoint }) => {
  const uid = getUid(); if (!uid) return;
  await rest('guest_push_subscriptions?uid=eq.' + uid + '&endpoint=eq.' + encodeURIComponent(endpoint), { method: 'DELETE', prefer: 'return=minimal' });
});

export function _resetStoreForTests() { state = blank(); lastSync = 0; syncing = null; }
