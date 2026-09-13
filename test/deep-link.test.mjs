import test from 'node:test';
import assert from 'node:assert/strict';
import { captureQrParam, peekQrPending } from '../src/boot/deep-link.js';

function fakeWindow(href) {
  const calls = [];
  return { location: { href }, history: { replaceState: (a, b, url) => calls.push(url) }, calls };
}

test('deep-link: ?qr=IC23:111/2 sa zachytí a z adresy zmizne', () => {
  const w = fakeWindow('https://home.primare.sk/?qr=IC23:111/2');
  const p = captureQrParam(w);
  assert.equal(p.raw, 'IC23:111/2');
  assert.deepEqual(w.calls, ['/']);
});

test('deep-link: aj v hash tvare #/report?qr=… (presmerovanie z RE SERVICE)', () => {
  const w = fakeWindow('https://home.primare.sk/#/report?qr=TARIF:B214&x=1');
  const p = captureQrParam(w);
  assert.equal(p.raw, 'TARIF:B214');
  assert.equal(w.calls[0], '/#/report?x=1');
});

test('deep-link: bez parametra nič nerobí; v node bez sessionStorage nič nečaká', () => {
  const w = fakeWindow('https://home.primare.sk/#/');
  assert.equal(captureQrParam(w), null);
  assert.equal(w.calls.length, 0);
  assert.equal(peekQrPending(), null);
});
