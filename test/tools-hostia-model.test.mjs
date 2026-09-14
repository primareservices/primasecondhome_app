// Čistá logika modulu Hostia pre PRIMA TOOLS (integrations/tools-hostia).
import test from 'node:test';
import assert from 'node:assert/strict';
import { genCode, normSurname, parseStaysRows, splitName, displayName, toISODate, slipLangs, slipUrl, normalizeRoomCode } from '../integrations/tools-hostia/hostia/model.js';
import { normSurname as appNorm } from '../src/data/demo-store.js';

test('genCode: prefix budovy + 6 znakov bez zameniteľných písmen', () => {
  const c = genCode('p_ic23'); assert.match(c, /^IC23-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  assert.equal(genCode('p_ic23', () => 0), 'IC23-AAAAAA'); assert.match(genCode('neznama'), /^PRIMA-/);
  assert.ok(!/[01IOL]/.test(genCode('p_tarif').slice(6)));
});
test('normSurname sa zhoduje s appkou hostí; mená z exportu', () => {
  for (const n of ['Kovaľenko', 'Dela Cruz', 'Ábel', 'Đorđević', 'Nguyễn Văn An']) assert.equal(normSurname(n), appNorm(n), n);
  assert.deepEqual(splitName('Kovalenko Oleksandr'), { surname: 'Kovalenko', given: 'Oleksandr' });
  assert.deepEqual(splitName('Oleksandr Kovalenko', false), { surname: 'Kovalenko', given: 'Oleksandr' });
  assert.equal(displayName({ surname: 'Kovalenko', given: 'Oleksandr' }), 'Oleksandr K.');
});
test('toISODate: slovenský tvar, ISO, Excel sériové číslo', () => {
  assert.equal(toISODate('15.6.2026'), '2026-06-15'); assert.equal(toISODate('2026-06-15'), '2026-06-15'); assert.equal(toISODate(46188), '2026-06-15'); assert.equal(toISODate(''), null);
});
test('parseStaysRows: hlavičky Casistu bez ohľadu na diakritiku, preskočí riadky bez izby', () => {
  const rows = [
    { 'Meno': 'Kovalenko Oleksandr', 'Príchod': '15.6.2026', 'Odchod': '31.12.2026', 'Izba': '111 / 2', 'Poznámka': '', 'Firma': 'Demo Agency' },
    { 'Meno': 'Dela Cruz Maria', 'Príchod': 46205, 'Odchod': null, 'Izba': 'b 214', 'Poznámka': 'dlhodobo', 'Firma': '' },
    { 'Meno': '', 'Príchod': '1.7.2026', 'Odchod': '', 'Izba': '101', 'Poznámka': '', 'Firma': '' },
  ];
  const { stays, skipped, columns } = parseStaysRows(rows);
  assert.equal(skipped, 1); assert.equal(stays.length, 2); assert.equal(columns.izba, 'Izba');
  assert.equal(stays[0].room, '111/2'); assert.equal(stays[0].checkIn, '2026-06-15'); assert.equal(stays[0].company, 'Demo Agency'); assert.equal(stays[0].displayName, 'Oleksandr K.');
  assert.equal(stays[1].room, 'B214'); assert.equal(stays[1].checkIn, '2026-07-02'); assert.equal(stays[1].checkOut, null); assert.equal(stays[1].note, 'dlhodobo');
});
test('lístok: jazyk hosťa prvý, max 5, odkaz do appky s kódom', () => {
  assert.deepEqual(slipLangs('hi'), ['hi', 'sk', 'en', 'uk', 'ru']); assert.deepEqual(slipLangs('sk'), ['sk', 'en', 'uk', 'ru']);
  assert.equal(slipUrl('IC23-7F3K9Q'), 'https://home.primare.sk/#/welcome?step=code&c=IC23-7F3K9Q');
  assert.equal(normalizeRoomCode('111 / bunka'), '111/bunka');
});
