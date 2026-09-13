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

test('outbox: trvalá chyba (permanent) položku vyradí a front pokračuje', async () => {
  _resetForTests();
  const sent = [];
  registerHandler('syncRequest', async (p) => { if (p.id === 'bad') { const e = new Error('rls'); e.permanent = true; throw e; } sent.push(p.id); });
  enqueue('syncRequest', { id: 'bad' }); enqueue('syncRequest', { id: 'ok' });
  const r = await flush();
  assert.deepEqual(sent, ['ok']); assert.equal(r.sent, 1); assert.equal(pendingCount(), 0);
});

test('outbox: položka zaradená počas čakajúceho handlera sa nestratí', async () => {
  _resetForTests();
  let release; const gate = new Promise(r => { release = r; });
  const sent = [];
  registerHandler('slow', async (p) => { await gate; sent.push(p.id); });
  registerHandler('syncRequest', async (p) => { sent.push(p.id); });
  enqueue('slow', { id: 'first' });
  const running = flush();
  await new Promise(r => setTimeout(r, 10));
  enqueue('syncRequest', { id: 'second' });   // pribudne, kým handler prvej položky čaká
  release(); await running;
  await flush();
  assert.deepEqual(sent, ['first', 'second']); assert.equal(pendingCount(), 0);
});
