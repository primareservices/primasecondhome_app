import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicKey, verify } from 'node:crypto';
import webpushLib from 'web-push';
import { b64u, encryptPayload, sendWebPush, vapidAuthorization } from '../supabase/functions/_shared/webpush.js';

// RFC 8291, príloha A — pevné kľúče, salt a očakávaný výstup.
const VEC = {
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  plaintext: 'When I grow up, I want to be a watermelon',
  expected: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

test('aes128gcm: šifrovanie sedí bajt po bajte s vektorom z RFC 8291', async () => {
  const out = await encryptPayload({ endpoint: 'https://push.example/x', keys: { p256dh: VEC.uaPublic, auth: VEC.auth } }, VEC.plaintext, { asPrivate: VEC.asPrivate, asPublic: VEC.asPublic, salt: VEC.salt });
  assert.equal(b64u.encode(out), VEC.expected);
});

test('VAPID: JWT ES256 sa overí verejným kľúčom a má správne aud/sub', async () => {
  const { publicKey, privateKey } = webpushLib.generateVAPIDKeys();
  const auth = await vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', { subject: 'mailto:office@primare.sk', publicKey, privateKey });
  const m = /^vapid t=([^,]+), k=(.+)$/.exec(auth); assert.ok(m); assert.equal(m[2], publicKey);
  const [h, p, s] = m[1].split('.');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(payload.aud, 'https://fcm.googleapis.com'); assert.equal(payload.sub, 'mailto:office@primare.sk'); assert.ok(payload.exp > Date.now() / 1000);
  const raw = Buffer.from(publicKey, 'base64url');
  const pub = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: raw.subarray(1, 33).toString('base64url'), y: raw.subarray(33, 65).toString('base64url') }, format: 'jwk' });
  assert.equal(verify('sha256', Buffer.from(h + '.' + p), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')), true);
});

test('sendWebPush: hlavičky a telo; 410 = predplatné zaniklo', async () => {
  const { publicKey, privateKey } = webpushLib.generateVAPIDKeys();
  const sub = { endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/xyz', keys: { p256dh: VEC.uaPublic, auth: VEC.auth } };
  let seen;
  const r = await sendWebPush(sub, JSON.stringify({ title: 'Test' }), { vapid: { subject: 'mailto:office@primare.sk', publicKey, privateKey }, ttl: 60, topic: 'ann', fetchImpl: async (url, init) => { seen = { url, init }; return new Response(null, { status: 410 }); } });
  assert.equal(r.gone, true); assert.equal(seen.url, sub.endpoint);
  assert.equal(seen.init.headers['Content-Encoding'], 'aes128gcm'); assert.equal(seen.init.headers.TTL, '60'); assert.equal(seen.init.headers.Topic, 'ann');
  assert.match(seen.init.headers.Authorization, /^vapid t=.+, k=.+$/); assert.ok(seen.init.body.length > 86 + 16);
});
