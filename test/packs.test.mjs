import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasPack, loadPack, packSync } from '../src/content/packs/index.js';

test('Tarif pack: facts stay numeric, texts fall back to English per language', async () => {
  assert.equal(hasPack('p_tarif'), true);
  assert.equal(hasPack('p_ic23'), false);
  const en = packSync('p_tarif', 'en');
  assert.equal(en.facts.beds, 1206);
  assert.equal(en.facts.laundry.slotHours, 2);
  assert.equal(en.rules.items.length, 13);
  assert.equal(typeof en.factsText.rooms, 'string');
  const vi = packSync('p_tarif', 'vi');
  assert.equal(vi.lang, 'en', 'no Vietnamese texts yet → English');
  const uk = await loadPack('p_tarif', 'uk');
  assert.equal(uk.lang, 'uk');
  assert.equal(uk.rules.items.length, 13);
  assert.equal(uk.city.title, en.city.title, 'city guide not translated to uk yet → English text');
  assert.equal(uk.facts.places.foreignPolice.address, 'Račianska 62');
});
