// Supabase adaptér nad falošným PostgREST (globálny fetch): prihlásenie kódom, žiadosť cez outbox
// s fotkou, konflikt práčovne, oznamy s prečítaním, mapovanie riadkov ↔ tvary appky.
import test from 'node:test';
import assert from 'node:assert/strict';
import { _configureForTests, _resetClientForTests } from '../src/data/supabase-client.js';
import { _resetForTests as resetOutbox, flush, pendingCount } from '../src/data/outbox.js';
import * as store from '../src/data/supabase-store.js';

const STAY = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', property_id: 'p_ic23', room: '111/2', display_name: 'Oleksandr K.', client_company: 'Demo Agency', check_in: '2026-06-15', check_out: '2026-12-31', registered_at: '2026-06-16', lang: 'uk', coordinator: { name: 'Peter Novák' } };
const calls = [];
let refSeq = 1100;
function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const path = u.pathname + u.search; const body = init.body && typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
  calls.push({ method: init.method || 'GET', path, body });
  if (path === '/auth/v1/signup') return json({ access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'uid-1' } });
  if (path === '/rest/v1/rpc/redeem_code') return body.p_surname === 'kov' && /1102/.test(body.p_code) ? json(STAY) : json({ id: null, room: null });
  if (path.startsWith('/rest/v1/guest_requests') && init.method === 'POST' && body.kind === 'service') return json({ message: 'unavailable' }, 503);   // prechodná chyba → ostane vo fronte
  if (path.startsWith('/rest/v1/guest_requests') && init.method === 'POST') { refSeq += 1; return json([{ ...body, ref: 'H-' + refSeq, updated_at: body.created_at, external_ref: null }]); }
  if (path.startsWith('/rest/v1/guest_requests')) return json([{ id: 'srv-1', ref: 'H-1041', stay_id: STAY.id, kind: 'issue', category: 'electric', place: 'room', room: '111/2', payload: { urgency: 'normal' }, photos: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/srv-1/1.jpg'], text: 'Світло', lang: 'uk', status: 'resolved', timeline: [{ at: '2026-09-01T10:00:00Z', status: 'reported' }], created_at: '2026-09-01T10:00:00Z', updated_at: '2026-09-02T10:00:00Z' }]);
  if (path.startsWith('/storage/v1/object/guest-photos/')) return json({ Key: path.slice('/storage/v1/object/'.length) });
  if (path.startsWith('/rest/v1/guest_bookings') && init.method === 'POST') return body.machine === 2 ? json({ message: 'duplicate key value violates unique constraint', code: '23505' }, 409) : json([{ ...body, status: 'booked', created_at: '2026-09-13T10:00:00Z' }]);
  if (path.startsWith('/rest/v1/rpc/laundry_occupancy')) return json([{ day: '2026-09-14', start: 18, len: 2, machine: 2 }]);
  if (path.startsWith('/rest/v1/guest_announcements')) return json([{ id: 'ann-1', property_id: 'p_ic23', severity: 'warning', valid_from: '2026-09-01T00:00:00Z', valid_to: '2099-01-01T00:00:00Z', texts: { en: { title: 'Water', body: 'x' } } }]);
  if (path.startsWith('/rest/v1/guest_ann_reads') && init.method === 'POST') return json(null, 201);
  if (path.startsWith('/rest/v1/guest_ann_reads')) return json([]);
  if (path.startsWith('/rest/v1/guest_stays')) return json([STAY]);
  if (path.startsWith('/rest/v1/')) return json([]);
  return json({ message: 'not found ' + path }, 404);
};

test('redeemCode: anonymné prihlásenie + RPC; zlé priezvisko = invalid; stay v tvare appky', async () => {
  _configureForTests({ url: 'https://demo.supabase.co', key: 'anon' }); _resetClientForTests(); resetOutbox(); store._resetStoreForTests();
  await assert.rejects(() => store.redeemCode('IC23-1102', 'Novák'), /invalid/);
  const stay = await store.redeemCode('IC23-1102', 'Kovalenko');
  assert.equal(stay.propertyId, 'p_ic23'); assert.equal(stay.room, '111/2'); assert.equal(stay.company, 'Demo Agency');
  assert.ok(calls.some(c => c.path === '/auth/v1/signup'));
  assert.deepEqual(store.getSession().stay.id, STAY.id);
});

test('createRequest: hneď v cache ako queued, outbox nahrá fotku a vloží riadok, ref príde zo servera', async () => {
  const req = store.createRequest(STAY.id, { kind: 'issue', category: 'door', place: 'room', room: '111/2', urgency: 'high', text: 'Dvere', lang: 'uk', photos: ['data:image/jpeg;base64,/9j/AAA='] });
  assert.equal(req.sync, 'queued'); assert.equal(req.ref, '…'); assert.equal(store.listRequests(STAY.id)[0].id, req.id);
  await flush();
  const r = store.getRequest(req.id);
  assert.equal(r.sync, 'synced'); assert.match(r.ref, /^H-\d+$/); assert.equal(r.urgency, 'high'); assert.equal(r.photos.length, 1);
  const ins = calls.find(c => c.method === 'POST' && c.path.startsWith('/rest/v1/guest_requests'));
  assert.equal(ins.body.payload.urgency, 'high'); assert.deepEqual(ins.body.photos, [STAY.id + '/' + req.id + '/1.jpg']); assert.equal(ins.body.stay_id, STAY.id);
  assert.equal(pendingCount(), 0);
});

test('syncAll: serverové žiadosti + lokálne čakajúce, oznamy s unread, obsadenosť práčovne ako foreign', async () => {
  store.createRequest(STAY.id, { kind: 'service', service: 'laundry', bags: 1, lang: 'uk' });   // server vráti 503 → ostane queued
  await flush();
  await store.syncAll(true);
  const list = store.listRequests(STAY.id);
  assert.ok(list.some(r => r.id === 'srv-1' && r.status === 'resolved' && r.photoPaths.length === 1 && r.photos.length === 0));
  assert.ok(list.some(r => r.kind === 'service' && r.sync === 'queued'));
  const ann = store.listAnnouncements('p_ic23');
  assert.equal(ann.length, 1); assert.equal(ann[0].unread, true);
  store.markAnnouncementsRead(['ann-1']);
  assert.equal(store.listAnnouncements('p_ic23')[0].unread, false);
  const b = store.listBookings(STAY.id);
  assert.ok(b.some(x => x.foreign && x.machine === 2 && x.start === 18));
});

test('createBooking: konflikt zo servera = taken, inak riadok v cache', async () => {
  await assert.rejects(() => store.createBooking(STAY.id, { day: '2026-09-14', start: 18, machine: 2 }), /taken/);
  const b = await store.createBooking(STAY.id, { day: '2026-09-14', start: 18, machine: 3 });
  assert.equal(b.status, 'booked'); assert.equal(store.listBookings(STAY.id).filter(x => !x.foreign).length, 1);
});

test('mapovanie: requestToRow ↔ requestFromRow zachová payload a základné polia', () => {
  const row = store.requestToRow({ id: 'r1', stayId: 's1', kind: 'document', doc: 'confirmation', purpose: 'new', passport: 'AB123', pickup: 'reception', lang: 'sk', createdAt: '2026-09-13T10:00:00Z', timeline: [] });
  assert.deepEqual(row.payload, { purpose: 'new', passport: 'AB123', pickup: 'reception', doc: 'confirmation' });
  const back = store.requestFromRow({ ...row, ref: 'H-1', updated_at: row.created_at });
  assert.equal(back.passport, 'AB123'); assert.equal(back.stayId, 's1'); assert.equal(back.sync, 'synced');
});
