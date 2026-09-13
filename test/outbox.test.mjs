import test from 'node:test';
import assert from 'node:assert/strict';
import { _resetForTests, enqueue, flush, isOnline, pendingCount, pendingItems, registerHandler, subscribeOutbox } from '../src/data/outbox.js';

test('outbox: enqueue → flush cez handler → prázdny front', async () => {
  _resetForTests();
  const sent = [];
  registerHandler('syncRequest', async (p) => { sent.push(p.id); });
  enqueue('syncRequest', { id: 'r1' }); enqueue('syncRequest', { id: 'r2' });
  assert.equal(pendingCount(), 2);
  const r = await flush();
  assert.deepEqual(sent, ['r1', 'r2']);
  assert.equal(r.sent, 2); assert.equal(pendingCount(), 0);
});

test('outbox: zlyhanie zastaví odosielanie, položka ostane s počtom pokusov', async () => {
  _resetForTests();
  let calls = 0;
  registerHandler('syncRequest', async (p) => { calls += 1; if (p.id === 'bad') throw new Error('network'); });
  enqueue('syncRequest', { id: 'bad' }); enqueue('syncRequest', { id: 'ok' });
  const r = await flush();
  assert.equal(r.sent, 0); assert.equal(pendingCount(), 2); assert.equal(calls, 1);
  assert.equal(pendingItems()[0].tries, 1); assert.match(pendingItems()[0].lastError, /network/);
});

test('outbox: neznámy handler ostáva v rade (iná verzia appky), ostatné sa odošlú', async () => {
  _resetForTests();
  registerHandler('syncRequest', async () => {});
  enqueue('unknownOp', { x: 1 }); enqueue('syncRequest', { id: 'r9' });
  await flush();
  assert.equal(pendingCount(), 1); assert.equal(pendingItems()[0].op, 'unknownOp');
});

test('outbox: poslucháč dostane zmenu, isOnline je v node true', async () => {
  _resetForTests();
  let n = 0; const off = subscribeOutbox(() => { n += 1; });
  enqueue('syncRequest', { id: 'r1' });
  assert.ok(n >= 1); off();
  assert.equal(isOnline(), true);
});
