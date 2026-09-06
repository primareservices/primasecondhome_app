import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// localStorage polyfill pre Node
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const store = await import('../src/data/demo-store.js');

beforeEach(() => { store.resetDemo(); });

test('redeemCode needs matching code and surname prefix (diacritics-insensitive)', () => {
  assert.throws(() => store.redeemCode('IC23-1102', 'Nov'), /invalid/);
  assert.throws(() => store.redeemCode('XXXX', 'Kov'), /invalid/);
  const stay = store.redeemCode('ic23 1102', 'Kóvalenko');
  assert.equal(stay.id, 'stay_demo_ic23');
  assert.equal(store.getSession().stay.room, '111/2');
  assert.ok(store.listRequests(stay.id).length >= 3, 'demo requests seeded');
});
test('createRequest assigns a reference and staff simulation advances old requests', () => {
  const stay = store.redeemCode('GAL-0201', 'KAR');
  const r = store.createRequest(stay.id, { kind: 'issue', category: 'wifi', place: 'room', room: '201', urgency: 'low', text: '' });
  assert.match(r.ref, /^H-\d+$/);
  assert.equal(r.status, 'reported');
  // posuň vznik o 5 minút dozadu → simulácia má prepnúť na 'inProgress'
  r.createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  store.createRequest(stay.id, { kind: 'service', service: 'laundry', bags: 1 }); // save() persist
  const aged = store.getRequest(r.id);
  assert.equal(aged.status, 'inProgress');
  assert.ok(aged.timeline.some(e => e.status === 'assigned'));
  const cancelled = store.cancelRequest(r.id);
  assert.equal(cancelled.status, 'cancelled');
});
test('announcements are scoped to the building and track unread state', () => {
  const ic23 = store.listAnnouncements('p_ic23');
  const nitra = store.listAnnouncements('p_nitra');
  assert.ok(ic23.length > nitra.length, 'IC23 has building-specific announcements');
  assert.ok(ic23.every(a => a.unread));
  store.markAnnouncementsRead(ic23.map(a => a.id));
  assert.ok(store.listAnnouncements('p_ic23').every(a => !a.unread));
});
