// Web Push bez knižníc (Deno aj Node ≥ 20, len WebCrypto): VAPID (RFC 8292) + šifrovanie aes128gcm
// (RFC 8291/8188). Overené proti testovaciemu vektoru z RFC 8291 (test/webpush.test.mjs).
// Použitie: sendWebPush(subscription, JSON.stringify(payload), { vapid: { subject, publicKey, privateKey }, ttl })
const enc = new TextEncoder();
export const b64u = {
  encode: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (s) => { const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(s).length / 4) * 4, '=')); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; },
};
const cat = (...parts) => { const n = parts.reduce((a, p) => a + p.length, 0); const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8));
}
async function importEcPublic(raw65) {
  return crypto.subtle.importKey('raw', raw65, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}
async function importEcPrivateFromB64u(privB64u, pubRaw65) {
  const x = b64u.encode(pubRaw65.slice(1, 33)), y = b64u.encode(pubRaw65.slice(33, 65));
  return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: privB64u, x, y }, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}

// RFC 8291: zašifruje payload pre subscription {endpoint, keys:{p256dh, auth}}. `test` dovolí pevný kľúč a salt.
export async function encryptPayload(subscription, payload, test = null) {
  const uaPub = b64u.decode(subscription.keys.p256dh);
  const authSecret = b64u.decode(subscription.keys.auth);
  const plaintext = typeof payload === 'string' ? enc.encode(payload) : payload;
  let asPriv, asPubRaw, salt;
  if (test) { asPubRaw = b64u.decode(test.asPublic); asPriv = await importEcPrivateFromB64u(test.asPrivate, asPubRaw); salt = b64u.decode(test.salt); }
  else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPriv = kp.privateKey; asPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)); salt = crypto.getRandomValues(new Uint8Array(16));
  }
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: await importEcPublic(uaPub) }, asPriv, 256));
  const ikm = await hkdf(authSecret, shared, cat(enc.encode('WebPush: info\0'), uaPub, asPubRaw), 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const padded = cat(plaintext, new Uint8Array([2]));   // posledný záznam: oddeľovač 0x02, bez výplne
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, padded));
  const rs = new Uint8Array([0, 0, 16, 0]);            // record size 4096
  const header = cat(salt, rs, new Uint8Array([asPubRaw.length]), asPubRaw);
  return cat(header, cipher);
}

// RFC 8292: hlavička Authorization: vapid t=<JWT ES256>, k=<verejný kľúč>
export async function vapidAuthorization(endpoint, { subject, publicKey, privateKey }, expSeconds = 12 * 3600) {
  const aud = new URL(endpoint).origin;
  const pubRaw = b64u.decode(publicKey);
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: privateKey, x: b64u.encode(pubRaw.slice(1, 33)), y: b64u.encode(pubRaw.slice(33, 65)) }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const h = b64u.encode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const p = b64u.encode(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + expSeconds, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(h + '.' + p)));
  return 'vapid t=' + h + '.' + p + '.' + b64u.encode(sig) + ', k=' + publicKey;
}

// Topic (RFC 8030 §5.4): max 32 znakov z URL-safe base64 abecedy — dlhší push služby odmietnu (400).
export const shortTopic = (t) => { const s = String(t || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32); return s || undefined; };
// Odošle notifikáciu. Vracia { ok, status, gone } — gone = 404/410, predplatné treba zmazať.
export async function sendWebPush(subscription, payload, { vapid, ttl = 24 * 3600, urgency = 'normal', topic, fetchImpl } = {}) {
  const body = await encryptPayload(subscription, payload);
  const headers = { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', TTL: String(ttl), Urgency: urgency, Authorization: await vapidAuthorization(subscription.endpoint, vapid) };
  const tp = shortTopic(topic); if (tp) headers.Topic = tp;
  const r = await (fetchImpl || fetch)(subscription.endpoint, { method: 'POST', headers, body });
  return { ok: r.ok, status: r.status, gone: r.status === 404 || r.status === 410 };
}
