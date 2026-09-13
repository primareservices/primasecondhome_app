import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpeechRecognition, speechLangFor } from '../src/domain/speech.js';
import { LANGS } from '../src/config/languages.js';

test('speech: každý jazyk appky má BCP-47 kód pre diktovanie', () => {
  for (const l of LANGS) assert.match(speechLangFor(l.code), /^[a-z]{2,3}-[A-Z]{2}$/, l.code);
  assert.equal(speechLangFor('xx'), 'en-US');
});
test('speech: bez okna nie je rozpoznávanie', () => {
  assert.equal(getSpeechRecognition(null), null);
  assert.equal(getSpeechRecognition({}), null);
  const C = function () {};
  assert.equal(getSpeechRecognition({ webkitSpeechRecognition: C }), C);
});
