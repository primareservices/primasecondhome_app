import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCellRoom, parseQrPayload, parseRoomLoc, roomLabel } from '../src/domain/room-codes.js';

test('parseQrPayload accepts full URL, query and bare payload', () => {
  assert.deepEqual(parseQrPayload('https://service.primare.sk/?qr=IC23:111/2'), { pid: 'IC23', room: '111/2' });
  assert.deepEqual(parseQrPayload('?qr=TARIF:B003'), { pid: 'TARIF', room: 'B003' });
  assert.deepEqual(parseQrPayload('IC15:Kuchy%C5%88a%20105'), { pid: 'IC15', room: 'Kuchyňa 105' });
  assert.equal(parseQrPayload('https://example.com/'), null);
  assert.equal(parseQrPayload(''), null);
});
test('room codes: cells, labels, floors', () => {
  assert.deepEqual(parseCellRoom('111/2'), { cell: '111', sub: '2' });
  assert.deepEqual(parseCellRoom('340'), { cell: null, sub: '340' });
  assert.equal(roomLabel('106/bunka'), '106');
  assert.equal(roomLabel('106/2'), '106/2');
  assert.deepEqual(parseRoomLoc('325'), { block: null, floor: '3' });
  assert.deepEqual(parseRoomLoc('B003'), { block: 'B', floor: '0' });
});
