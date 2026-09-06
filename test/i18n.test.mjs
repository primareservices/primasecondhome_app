import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LANGS } from '../src/config/languages.js';

const dir = fileURLToPath(new URL('../src/i18n/translations/', import.meta.url));
const load = async (f) => (await import(pathToFileURL(dir + f).href)).default;
const vars = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');

test('every configured language has a dictionary with all English keys', async () => {
  const en = await load('en.js');
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const l of LANGS) {
    assert.ok(files.includes(l.code + '.js'), 'missing dictionary for ' + l.code);
    const d = await load(l.code + '.js');
    const missing = Object.keys(en).filter(k => !(k in d));
    assert.deepEqual(missing, [], l.code + ' missing keys');
    const extra = Object.keys(d).filter(k => !(k in en));
    assert.deepEqual(extra, [], l.code + ' extra keys');
    for (const k of Object.keys(en)) {
      assert.equal(vars(d[k]), vars(en[k]), l.code + ' placeholders differ in ' + k);
      assert.ok(String(d[k]).trim().length > 0, l.code + ' empty ' + k);
    }
  }
});
