// Zrkadlo v supabase/functions/_shared/ticket-bridge.js musí dávať rovnaký ticket ako src/domain/ticket-bridge.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as app from '../src/domain/ticket-bridge.js';
import * as edge from '../supabase/functions/_shared/ticket-bridge.js';
import { statusFromTicket as appStatus, STATUS } from '../src/domain/request-status.js';

const stay = { id: 's1', propertyId: 'p_ic23', room: '111/2' };
const cases = [
  { id: 'r1', kind: 'issue', category: 'door', place: 'room', room: '111/2', urgency: 'high', text: 'Двері', textEn: 'Door', lang: 'uk', photos: [] },
  { id: 'r2', kind: 'issue', category: 'clean', place: 'kitchen', roomOther: '3. posch.', urgency: 'normal', text: 'špina', lang: 'sk', photos: [] },
  { id: 'r3', kind: 'issue', category: 'pests', place: 'room', room: '001/bunka', urgency: 'low', text: 'ploštice', lang: 'sk', photos: [] },
  { id: 'r4', kind: 'issue', category: 'noise', place: 'corridor', text: 'hluk', lang: 'sk', photos: [] },
  { id: 'r5', kind: 'issue', category: 'unknown', place: 'other', roomOther: 'B214', text: 'x', lang: 'en', photos: [] },
  { id: 'r6', kind: 'service', service: 'laundry' },
];
test('buildTicketFromRequest: appka a edge zrkadlo sa zhodujú', () => {
  const now = new Date('2026-09-14T08:00:00Z');
  for (const c of cases) assert.deepEqual(edge.buildTicketFromRequest(c, stay, null, { now }), app.buildTicketFromRequest(c, stay, null, { now }), c.id);
});
test('placeFromRoomCode a statusFromTicket sa zhodujú', () => {
  for (const code of ['111/2', '001/bunka', 'B214', 'Kuchyňa 3. posch.', 'Práčovňa', '325', '']) assert.deepEqual(edge.placeFromRoomCode(code), app.placeFromRoomCode(code), code);
  for (const re of Object.values(STATUS).map(s => s.re).filter(Boolean)) assert.equal(edge.statusFromTicket(re), appStatus(re), re);
  assert.equal(edge.statusFromTicket('???'), 'reported');
});
test('ticketToRow má tvar RE SERVICE (id + indexované stĺpce + data) a notifikácia správne roly', () => {
  const t = edge.buildTicketFromRequest(cases[1], stay, null);
  const row = edge.ticketToRow(t);
  assert.deepEqual(Object.keys(row).sort(), ['created_at', 'data', 'for_housekeeping', 'id', 'project_id', 'property_id', 'scheduled_for', 'status', 'updated_at']);
  assert.equal(row.for_housekeeping, true); assert.equal(row.status, 'Nahlásené'); assert.equal(row.data.room, 'Kuchyňa 3. posch.');
  assert.ok(edge.staffNotification(t).roles.includes('Chyžná'));
  assert.ok(edge.staffNotification(edge.buildTicketFromRequest(cases[0], stay, null)).roles.includes('Údržbár'));
});
