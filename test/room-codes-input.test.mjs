import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRoom, isRoomCode, normalizeRoomCode } from '../src/domain/room-codes.js';

test('normalizeRoomCode: medzery, veľkosť písmen, bunka', () => {
  assert.equal(normalizeRoomCode(' b 214 '), 'B214');
  assert.equal(normalizeRoomCode('111 / 2'), '111/2');
  assert.equal(normalizeRoomCode('111/BUNKA'), '111/bunka');
  assert.equal(normalizeRoomCode('019/2a'), '019/2A');
  assert.equal(normalizeRoomCode(''), '');
});
test('isRoomCode: pravidlá RE SERVICE (blok + číslice, /izba alebo /bunka)', () => {
  for (const ok of ['111/2', 'B214', '325', '001/bunka', 'A020', '1204', '019/2A']) assert.ok(isRoomCode(ok), ok);
  for (const bad of ['kuchyňa 3. posch.', '', 'B', '111/', '12345', 'B214/2/3', 'B-214']) assert.ok(!isRoomCode(bad), bad);
});
test('describeRoom: bunka + izba + poschodie, blok + poschodie, prízemie', () => {
  assert.deepEqual(describeRoom('111/2'), { cell: '111', sub: '2', common: false, block: null, floor: '1' });
  assert.deepEqual(describeRoom('B214'), { cell: null, sub: 'B214', common: false, block: 'B', floor: '2' });
  assert.deepEqual(describeRoom('001/bunka'), { cell: '001', sub: null, common: true, block: null, floor: '0' });
  assert.equal(describeRoom('kuchyňa'), null);
});
