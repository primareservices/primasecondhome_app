// Overenie totožnosti (eKYC): adaptéry poskytovateľov (HMAC, rozhodnutia, session), edge funkcie
// identity-start / identity-webhook s falošnými klientmi, demo simulácia a Supabase adaptér.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, activeProvider, hmacHex, safeEqual } from '../supabase/functions/_shared/identity-providers.js';
import { handle as start, uidFromJwt } from '../supabase/functions/identity-start/handler.js';
import { handle as webhook } from '../supabase/functions/identity-webhook/handler.js';

process.env.SUPABASE_URL = 'https://own.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'own'; process.env.APP_URL = 'https://home.primare.sk';
const STAY = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = 'x.' + b64u({ sub: 'uid-1', role: 'authenticated' }) + '.y';
function fakeClient(routes) {
  const calls = [];
  return { calls, rest: async (path, opts = {}) => { calls.push({ path, ...opts }); for (const [re, fn] of routes) { const m = re.exec((opts.method || 'GET') + ' ' + path); if (m) return typeof fn === 'function' ? fn(m, opts) : fn; } return []; } };
}
const post = (url, body, headers = {}) => new Request(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('providers: HMAC hex + safeEqual; iDenfy a Veriff overia podpis nad surovým telom', async () => {
  assert.equal(await hmacHex('key', 'The quick brown fox jumps over the lazy dog'), 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  assert.ok(safeEqual('AbC', 'abc')); assert.ok(!safeEqual('abc', 'abd')); assert.ok(!safeEqual('abc', 'abcd'));
  process.env.IDENFY_WEBHOOK_KEY = 'idk'; process.env.VERIFF_SHARED_SECRET = 'vsk'; process.env.VERIFF_API_KEY = 'vak';
  const raw = '{"a":1}';
  assert.equal(await PROVIDERS.idenfy.verify(raw, new Headers({ 'idenfy-signature': await hmacHex('idk', raw) })), true);
  assert.equal(await PROVIDERS.idenfy.verify(raw, new Headers({ 'idenfy-signature': await hmacHex('zle', raw) })), false);
  assert.equal(await PROVIDERS.veriff.verify(raw, new Headers({ 'x-auth-client': 'vak', 'x-hmac-signature': await hmacHex('vsk', raw) })), true);
  assert.equal(await PROVIDERS.veriff.verify(raw, new Headers({ 'x-auth-client': 'iny', 'x-hmac-signature': await hmacHex('vsk', raw) })), false);
  delete process.env.IDENFY_WEBHOOK_KEY;
  assert.equal(await PROVIDERS.idenfy.verify(raw, new Headers({ 'idenfy-signature': 'x' })), false);   // bez kľúča nikdy
});

test('providers: rozhodnutia → approved/declined/review, len údaje pre domovú knihu; priebežné udalosti sa ignorujú', () => {
  const idn = PROVIDERS.idenfy.parse({ final: true, scanRef: 'scan-1', clientId: STAY, status: { overall: 'APPROVED' }, data: { docFirstName: 'OLEKSANDR', docLastName: 'KOVALENKO', docDob: '1990-05-01', docNationality: 'UA', docType: 'PASSPORT', docNumber: 'FX123456', docExpiry: '2031-01-01', docIssuingCountry: 'UA', docSex: 'M', selfie: 'base64…' } });
  assert.equal(idn.status, 'approved'); assert.equal(idn.ref, 'scan-1'); assert.equal(idn.stayId, STAY);
  assert.deepEqual(idn.data, { firstName: 'OLEKSANDR', lastName: 'KOVALENKO', dob: '1990-05-01', nationality: 'UA', docType: 'PASSPORT', docNumber: 'FX123456', docExpiry: '2031-01-01', docCountry: 'UA' });
  assert.equal(PROVIDERS.idenfy.parse({ final: true, scanRef: 's', status: { overall: 'DENIED' } }).status, 'declined');
  assert.equal(PROVIDERS.idenfy.parse({ final: true, scanRef: 's', status: { overall: 'SUSPECTED' } }).status, 'review');
  assert.equal(PROVIDERS.idenfy.parse({ final: true, scanRef: 's', status: { overall: 'EXPIRED' } }).status, 'pending');
  assert.equal(PROVIDERS.idenfy.parse({ final: false, scanRef: 's', status: { overall: 'ACTIVE' } }), null);
  const v = PROVIDERS.veriff.parse({ status: 'success', verification: { id: 'ver-1', code: 9001, status: 'approved', vendorData: STAY, person: { firstName: 'Iryna', lastName: 'Shevchenko', dateOfBirth: '1992-02-02', nationality: 'UA' }, document: { number: 'AB1', type: 'ID_CARD', validUntil: '2030-01-01', country: 'UA' } } });
  assert.equal(v.status, 'approved'); assert.equal(v.ref, 'ver-1'); assert.equal(v.data.lastName, 'Shevchenko'); assert.equal(v.data.docType, 'ID_CARD');
  assert.equal(PROVIDERS.veriff.parse({ verification: { id: 'v', status: 'declined' } }).status, 'declined');
  assert.equal(PROVIDERS.veriff.parse({ verification: { id: 'v', status: 'resubmission_requested' } }).status, 'review');
  assert.equal(PROVIDERS.veriff.parse({ verification: { id: 'v', status: 'expired' } }).status, 'pending');
  assert.equal(PROVIDERS.veriff.parse({ status: 'success', action: 'started', vendorData: STAY, id: 'v' }), null);   // udalosť bez rozhodnutia
});

test('providers: session u iDenfy (Basic auth, redirect) a Veriff (X-AUTH-CLIENT, lang); activeProvider podľa secrets', async () => {
  process.env.IDENFY_API_KEY = 'ik'; process.env.IDENFY_API_SECRET = 'is';
  const reqs = [];
  const f = async (url, init) => { reqs.push({ url, init }); return url.includes('idenfy') ? new Response(JSON.stringify({ authToken: 'tok en', scanRef: 'scan-9' }), { status: 200 }) : new Response(JSON.stringify({ status: 'success', verification: { id: 'ver-9', url: 'https://magic.veriff.me/v/abc' } }), { status: 200 }); };
  const s = await PROVIDERS.idenfy.createSession({ stay: { id: STAY, display_name: 'Oleksandr K.' }, lang: 'uk', returnUrl: 'https://home.primare.sk/#/identity?done=1', webhookUrl: 'https://own.supabase.co/functions/v1/identity-webhook?provider=idenfy', fetchImpl: f });
  assert.equal(s.ref, 'scan-9'); assert.equal(s.url, 'https://ivs.idenfy.com/api/v2/redirect?authToken=tok%20en');
  assert.equal(reqs[0].init.headers.Authorization, 'Basic ' + Buffer.from('ik:is').toString('base64'));
  const body = JSON.parse(reqs[0].init.body);
  assert.equal(body.clientId, STAY); assert.equal(body.locale, 'uk'); assert.equal(body.successUrl, 'https://home.primare.sk/#/identity?done=1&r=ok'); assert.equal(body.callbackUrl, 'https://own.supabase.co/functions/v1/identity-webhook?provider=idenfy');
  process.env.VERIFF_API_KEY = 'vak'; process.env.VERIFF_SHARED_SECRET = 'vsk';
  const v = await PROVIDERS.veriff.createSession({ stay: { id: STAY, display_name: 'Oleksandr K.' }, lang: 'uk', returnUrl: 'https://home.primare.sk/#/identity?done=1', fetchImpl: f });
  assert.equal(v.ref, 'ver-9'); assert.equal(v.url, 'https://magic.veriff.me/v/abc?lang=uk');
  assert.equal(reqs[1].init.headers['X-AUTH-CLIENT'], 'vak'); assert.equal(JSON.parse(reqs[1].init.body).verification.vendorData, STAY); assert.equal(JSON.parse(reqs[1].init.body).verification.person.firstName, 'Oleksandr');
  process.env.IDENTITY_PROVIDER = 'veriff'; assert.equal(activeProvider().name, 'veriff');
  process.env.IDENTITY_PROVIDER = 'idenfy'; assert.equal(activeProvider().name, 'idenfy');
  process.env.IDENTITY_PROVIDER = ''; assert.equal(activeProvider(), null);
  delete process.env.VERIFF_API_KEY; process.env.IDENTITY_PROVIDER = 'veriff'; assert.equal(activeProvider(), null);   // vybraný, ale bez kľúčov
  process.env.IDENTITY_PROVIDER = '';
});

test('identity-start: JWT → pobyt → session u poskytovateľa → guest_identity pending; bez poskytovateľa unavailable; schválené sa neopakuje', async () => {
  assert.equal(uidFromJwt(new Request('https://fn/x', { headers: { authorization: 'Bearer ' + jwt } })), 'uid-1');
  assert.equal(uidFromJwt(new Request('https://fn/x')), null);
  let identity = [];
  const own = fakeClient([[/^GET guest_links/, [{ stay_id: STAY }]], [/^GET guest_stays/, [{ id: STAY, display_name: 'Oleksandr K.', lang: 'uk', closed_at: null }]], [/^GET guest_identity/, () => identity]]);
  let res = await start(post('https://fn/identity-start', { lang: 'uk' }), { own });
  assert.equal(res.status, 401);
  res = await (await start(post('https://fn/identity-start', { lang: 'uk' }, { authorization: 'Bearer ' + jwt }), { own })).json();
  assert.equal(res.status, 'unavailable');   // IDENTITY_PROVIDER prázdny
  const provider = { name: 'idenfy', createSession: async ({ stay, lang, returnUrl, webhookUrl }) => { assert.equal(stay.id, STAY); assert.equal(lang, 'uk'); assert.equal(returnUrl, 'https://home.primare.sk/#/identity?done=1'); assert.equal(webhookUrl, 'https://own.supabase.co/functions/v1/identity-webhook?provider=idenfy'); return { ref: 'scan-1', url: 'https://ivs.idenfy.com/api/v2/redirect?authToken=t' }; } };
  res = await (await start(post('https://fn/identity-start', { lang: 'uk' }, { authorization: 'Bearer ' + jwt }), { own, provider })).json();
  assert.equal(res.status, 'pending'); assert.equal(res.url, 'https://ivs.idenfy.com/api/v2/redirect?authToken=t'); assert.equal(res.ref, 'scan-1');
  const up = own.calls.find(c => c.method === 'POST' && c.path.startsWith('guest_identity'));
  assert.equal(up.path, 'guest_identity?on_conflict=stay_id'); assert.equal(up.body.status, 'pending'); assert.equal(up.body.provider_ref, 'scan-1'); assert.equal(up.body.stay_id, STAY);
  identity = [{ status: 'approved', provider: 'idenfy', checked_at: '2026-09-14T10:00:00Z' }];
  res = await (await start(post('https://fn/identity-start', {}, { authorization: 'Bearer ' + jwt }), { own, provider })).json();
  assert.equal(res.status, 'approved'); assert.equal(res.checkedAt, '2026-09-14T10:00:00Z');
});

test('identity-webhook: zlý podpis 401; schválenie → PATCH stavu + údajov + push; udalosť bez rozhodnutia sa ignoruje; neznámy ref 404', async () => {
  process.env.IDENFY_WEBHOOK_KEY = 'idk';
  process.env.VAPID_PUBLIC_KEY = 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'; process.env.VAPID_PRIVATE_KEY = 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw';
  const sub = { uid: 'u1', endpoint: 'https://push.example/1', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } };
  const own = fakeClient([[/^GET guest_identity\?select=stay_id,status&provider_ref=eq\.scan-1/, [{ stay_id: STAY, status: 'pending' }]], [/^GET guest_identity/, []], [/^GET guest_stays/, [{ id: STAY, lang: 'uk' }]], [/^GET guest_links/, [{ uid: 'u1', stay_id: STAY }]], [/^GET guest_push_subscriptions/, [sub]], [/^GET guest_prefs/, []]]);
  const pushed = [];
  const pushFetch = async (url, init) => { pushed.push({ url, init }); return new Response(null, { status: 201 }); };
  const payload = JSON.stringify({ final: true, scanRef: 'scan-1', clientId: STAY, status: { overall: 'APPROVED' }, data: { docFirstName: 'OLEKSANDR', docLastName: 'KOVALENKO', docNationality: 'UA', docNumber: 'FX1' } });
  let res = await webhook(post('https://fn/identity-webhook?provider=idenfy', payload, { 'idenfy-signature': 'nope' }), { own, pushFetch });
  assert.equal(res.status, 401);
  res = await webhook(post('https://fn/identity-webhook?provider=nikto', payload), { own });
  assert.equal(res.status, 404);
  res = await (await webhook(post('https://fn/identity-webhook?provider=idenfy', payload, { 'idenfy-signature': await hmacHex('idk', payload) }), { own, pushFetch })).json();
  assert.equal(res.status, 'approved'); assert.equal(res.pushed, 1);
  const patch = own.calls.find(c => c.method === 'PATCH');
  assert.equal(patch.path, 'guest_identity?stay_id=eq.' + STAY); assert.equal(patch.body.status, 'approved'); assert.deepEqual(patch.body.data, { firstName: 'OLEKSANDR', lastName: 'KOVALENKO', nationality: 'UA', docNumber: 'FX1' }); assert.ok(patch.body.checked_at);
  assert.equal(pushed[0].init.headers.Topic, ('idn-' + STAY).slice(0, 32));   // Topic max 32 znakov
  const ev = JSON.stringify({ final: false, scanRef: 'scan-1', status: { overall: 'ACTIVE' } });
  res = await (await webhook(post('https://fn/identity-webhook?provider=idenfy', ev, { 'idenfy-signature': await hmacHex('idk', ev) }), { own, pushFetch })).json();
  assert.equal(res.ignored, 'event');
  const unk = JSON.stringify({ final: true, scanRef: 'scan-x', status: { overall: 'DENIED' } });
  res = await webhook(post('https://fn/identity-webhook?provider=idenfy', unk, { 'idenfy-signature': await hmacHex('idk', unk) }), { own, pushFetch });
  assert.equal(res.status, 404);
  delete process.env.IDENFY_WEBHOOK_KEY;
});

test('demo-store: startIdentity → pending → approved; preskočenie ostáva zapamätané; forgetMe vymaže', async () => {
  globalThis.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
  const demo = await import('../src/data/demo-store.js');
  demo.resetDemo();
  assert.equal(demo.getIdentity('s1'), null);
  const r = await demo.startIdentity('s1', { delay: 20 });
  assert.equal(r.status, 'pending'); assert.equal(demo.getIdentity('s1').status, 'pending');
  await new Promise(res => setTimeout(res, 60));
  assert.equal(demo.getIdentity('s1').status, 'approved'); assert.ok(demo.getIdentity('s1').checkedAt);
  demo.setIdentitySkipped('s2', true);
  assert.deepEqual(demo.getIdentity('s2'), { stayId: 's2', status: null, provider: null, checkedAt: null, skipped: true });
});
