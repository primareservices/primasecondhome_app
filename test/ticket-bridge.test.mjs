import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTicketFromRequest, placeFromRoomCode, roomCodeForRequest } from '../src/domain/ticket-bridge.js';

const stay = { id: 's1', propertyId: 'p_ic23', room: '111/2' };
const property = { id: 'p_ic23' };
const now = new Date('2026-09-06T10:00:00Z');

test('issue in own room becomes a RE SERVICE ticket with mapped category and priority', () => {
  const req = { id: 'abc', kind: 'issue', category: 'door', place: 'room', room: '111/2', urgency: 'high', text: 'Двері не зачиняються', textEn: 'Door does not close', lang: 'uk', photos: [] };
  const tk = buildTicketFromRequest(req, stay, property, { now });
  assert.equal(tk.id, 'G-abc');
  assert.equal(tk.propertyId, 'p_ic23');
  assert.equal(tk.room, '111/2');
  assert.equal(tk.category, 'Dvere');
  assert.equal(tk.forHousekeeping, false);
  assert.equal(tk.priority, 'Vysoká');
  assert.equal(tk.status, 'Nahlásené');
  assert.deepEqual(tk.place, { type: 'room', cell: '111', room: '2', space: null, roomNo: null });
  assert.ok(tk.description.includes('[EN] Door does not close'));
  assert.equal(tk.createdAt, now.toISOString());
});
test('pests go to housekeeping and flag DDD; kitchen maps to the building space label', () => {
  const req = { id: 'x', kind: 'issue', category: 'pests', place: 'kitchen', roomOther: '105', urgency: 'normal', text: '' };
  const tk = buildTicketFromRequest(req, stay, property, { now });
  assert.equal(tk.category, 'Deratizácia');
  assert.equal(tk.forHousekeeping, true);
  assert.equal(tk.source.ddd, true);
  assert.equal(tk.room, 'Kuchyňa 105');
  assert.deepEqual(tk.place, { type: 'building', cell: null, room: null, space: 'kuchyna', roomNo: '105' });
});
test('noise complaints and non-issues never become tickets', () => {
  assert.equal(buildTicketFromRequest({ id: 'n', kind: 'issue', category: 'noise', place: 'room' }, stay, property), null);
  assert.equal(buildTicketFromRequest({ id: 's', kind: 'service', service: 'laundry' }, stay, property), null);
});
test('placeFromRoomCode mirrors RE SERVICE for cells', () => {
  assert.deepEqual(placeFromRoomCode('001/bunka'), { type: 'cell', cell: '001', room: null, space: null, roomNo: null });
  assert.equal(roomCodeForRequest({ place: 'room', room: null }, stay), '111/2');
});
