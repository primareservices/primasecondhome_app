// Edge funkcie s falošnými klientmi (bez siete): most do RE SERVICE, sync stavov, push pri ozname,
// podpis bez Cloudflare (len záznam), čistenie súborov.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle as bridge } from '../supabase/functions/guest-request-bridge/handler.js';
import { handle as sync } from '../supabase/functions/sync-ticket-status/handler.js';
import { handle as sendPush } from '../supabase/functions/send-push/handler.js';
import { handle as signRules, rulesHtml } from '../supabase/functions/sign-rules/handler.js';
import { handle as cleanup } from '../supabase/functions/guest-cleanup/handler.js';

process.env.WEBHOOK_SECRET = 'tajne'; process.env.RE_SERVICE_URL = 'https://re.supabase.co'; process.env.RE_SERVICE_SERVICE_KEY = 'srv';
process.env.SUPABASE_URL = 'https://own.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'own';
const post = (body, secret = 'tajne') => new Request('https://fn/x', { method: 'POST', headers: { 'content-type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) }, body: JSON.stringify(body) });
function fakeClient(routes) {
  const calls = [];
  const c = { base: 'https://own.supabase.co', calls,
    rest: async (path, opts = {}) => { calls.push({ path, ...opts }); for (const [re, fn] of routes) { const m = re.exec((opts.method || 'GET') + ' ' + path); if (m) return typeof fn === 'function' ? fn(m, opts) : fn; } return []; },
    rpc: async (name, args) => { calls.push({ path: 'rpc/' + name, body: args }); const r = routes.find(([re]) => re.test('RPC ' + name)); return r ? (typeof r[1] === 'function' ? r[1](null, { body: args }) : r[1]) : null; },
    sign: async (bucket, path) => 'https://own.supabase.co/storage/v1/object/sign/' + bucket + '/' + path + '?token=x',
    download: async () => new Uint8Array([137, 80, 78, 71]), upload: async (b, p) => { calls.push({ path: 'upload ' + b + '/' + p }); return p; },
    list: async (b, prefix) => (prefix.startsWith('stay-old') ? [{ name: 'a.jpg' }, { name: 'b.pdf' }] : []), remove: async (b, names) => { calls.push({ path: 'remove ' + b, body: names }); return true; } };
  return c;
}
const STAY = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', property_id: 'p_ic23', room: '111/2', display_name: 'Oleksandr K.', lang: 'uk', check_in: '2026-06-15' };

test('bridge: 403 bez secretu, skip pre službu, ticket + notifikácia + external_ref pre poruchu', async () => {
  assert.equal((await bridge(post({ record: { id: 'x', kind: 'issue' } }, null))).status, 403);
  assert.deepEqual(await (await bridge(post({ record: { id: 'x', kind: 'service' } }))).json(), { skipped: 'not_issue' });
  const own = fakeClient([[/^GET guest_stays/, [STAY]]]);
  const re = fakeClient([]);
  const record = { id: '0f3a9c2e-1111-4222-8333-444455556666', stay_id: STAY.id, kind: 'issue', category: 'door', place: 'room', room: '111/2', payload: { urgency: 'high' }, photos: [STAY.id + '/r/1.jpg'], text: 'Двері у ванну не зачиняються.', lang: 'uk', created_at: '2026-09-14T08:00:00Z', ref: 'H-1102' };
  const res = await (await bridge(post({ type: 'INSERT', table: 'guest_requests', record }), { own, re })).json();
  assert.equal(res.ok, true); assert.match(res.ticket, /^G-[0-9A-F]{10}$/);
  const ins = re.calls.find(c => c.path.startsWith('tickets'));
  const row = ins.body[0];
  assert.equal(row.property_id, 'p_ic23'); assert.equal(row.status, 'Nahlásené'); assert.equal(row.for_housekeeping, false);
  assert.equal(row.data.category, 'Dvere'); assert.equal(row.data.priority, 'Vysoká'); assert.equal(row.data.room, '111/2'); assert.equal(row.data.place.type, 'room');
  assert.match(row.data.description, /Fotky hosťa:\nhttps:\/\/own\.supabase\.co\/storage/); assert.equal(row.data.source.guestName, 'Oleksandr K.');
  assert.ok(re.calls.some(c => c.path === 'notifications' && c.body[0].roles.includes('Údržbár')));
  const patch = own.calls.find(c => c.method === 'PATCH'); assert.equal(patch.body.external_ref, res.ticket);
});

test('bridge: hluk ide len recepcii, už premostené sa preskočí', async () => {
  const own = fakeClient([[/^GET guest_stays/, [STAY]]]); const re = fakeClient([]);
  assert.deepEqual(await (await bridge(post({ record: { id: 'a-b', stay_id: STAY.id, kind: 'issue', category: 'noise', text: 'hluk' } }), { own, re })).json(), { skipped: 'reception_only' });
  assert.deepEqual(await (await bridge(post({ record: { id: 'a-b', kind: 'issue', external_ref: 'G-1' } }), { own, re })).json(), { skipped: 'already_bridged' });
  assert.equal(re.calls.length, 0);
});

test('sync-ticket-status: vyriešený ticket → stav + poznámka v časovej osi; push bez predplatných = 0', async () => {
  const own = fakeClient([[/^GET guest_requests/, [{ id: 'r1', stay_id: STAY.id, ref: 'H-1102', status: 'assigned', timeline: [{ at: '2026-09-14T08:00:00Z', status: 'reported' }], external_ref: 'G-1', lang: 'uk' }]], [/^GET guest_links/, []]]);
  const re = fakeClient([[/^GET tickets/, [{ id: 'G-1', status: 'Vyriešené', updated_at: 'x', data: { resolution: 'Vymenený zámok.' } }]]]);
  const res = await (await sync(post({}), { own, re })).json();
  assert.equal(res.changed, 1); assert.equal(res.pushed, 0);
  const patch = own.calls.find(c => c.method === 'PATCH');
  assert.equal(patch.body.status, 'resolved'); assert.equal(patch.body.timeline.length, 2); assert.equal(patch.body.timeline[1].note.sk, 'Vymenený zámok.');
});

test('send-push: oznam sa rozošle hosťom budovy v ich jazyku; 410 zmaže predplatné', async () => {
  const sub = { uid: 'u1', endpoint: 'https://push.example/1', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } };
  process.env.VAPID_PUBLIC_KEY = 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'; process.env.VAPID_PRIVATE_KEY = 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw';
  const own = fakeClient([[/^GET guest_stays/, [{ id: STAY.id, lang: 'uk' }]], [/^GET guest_links/, [{ uid: 'u1', stay_id: STAY.id }]], [/^GET guest_push_subscriptions/, [sub]], [/^GET guest_prefs/, []]]);
  const pushed = [];
  const record = { id: 'ann-1', property_id: 'p_ic23', severity: 'urgent', valid_from: '2026-09-01T00:00:00Z', texts: { sk: { title: 'Odstávka vody', body: 'Utorok 9–12' }, uk: { title: 'Відключення води', body: 'Вівторок 9–12' } } };
  let res = await (await sendPush(post({ type: 'INSERT', record }), { own, pushFetch: async (url, init) => { pushed.push({ url, init }); return new Response(null, { status: 201 }); } })).json();
  assert.equal(res.recipients, 1); assert.equal(res.sent, 1); assert.equal(pushed[0].init.headers.Urgency, 'normal'); assert.equal(pushed[0].init.headers.Topic, 'ann-ann-1');
  res = await (await sendPush(post({ record }), { own, pushFetch: async () => new Response(null, { status: 410 }) })).json();
  assert.equal(res.gone, 1); assert.ok(own.calls.some(c => c.method === 'DELETE' && c.path.startsWith('guest_push_subscriptions')));
});

test('sign-rules: bez Cloudflare secrets vráti pdf:false; HTML má jazyk hosťa aj slovenčinu a auditný blok', async () => {
  delete process.env.CF_ACCOUNT_ID;
  const own = fakeClient([[/^GET guest_stays/, [STAY]], [/^GET properties/, [{ id: 'p_ic23', name: 'PRIMA IC 23', address: 'Ivanská cesta 23' }]], [/^GET rules/, [{ version: '2026-09', texts: { sk: { intro: 'Vitajte', items: [{ title: 'Kľúče', text: 'Nestrácajte.' }] }, uk: { intro: 'Ласкаво просимо', items: [{ title: 'Ключі', text: 'Не губіть.' }] } } }]]]);
  const sig = { id: 'sig-1', stay_id: STAY.id, version: '2026-09', name: 'Oleksandr Kovalenko', lang: 'uk', signature_path: STAY.id + '/signature-sig-1.png', signed_at: '2026-09-14T08:00:00Z', audit: { app_version: 'v0.3.0' } };
  const res = await (await signRules(post({ record: sig }), { own })).json();
  assert.deepEqual(res, { ok: true, pdf: false, email: false, rules: true });
  const html = rulesHtml({ stay: STAY, property: { name: 'PRIMA IC 23', address: 'x' }, version: '2026-09', texts: { sk: { items: [{ title: 'Kľúče', text: 'Nestrácajte.' }] }, uk: { items: [{ title: 'Ключі', text: 'Не губіть <b>.' }] } }, lang: 'uk', signaturePng: 'data:image/png;base64,AA==', sig, appVersion: 'v0.3.0' });
  assert.match(html, /lang="uk"/); assert.match(html, /lang="sk"/); assert.match(html, /Не губіть &lt;b&gt;\./); assert.match(html, /Oleksandr Kovalenko/); assert.match(html, /111\/2/);
});

test('guest-cleanup: zavolá RPC a zmaže súbory anonymizovaných pobytov', async () => {
  const own = fakeClient([[/^RPC guest_cleanup/, 2], [/^GET guest_stays/, [{ id: 'stay-old' }]]]);
  const res = await (await cleanup(post({}), { own })).json();
  assert.equal(res.anonymized, 2); assert.equal(res.filesRemoved, 4);
  assert.ok(own.calls.some(c => c.path === 'remove guest-docs' && c.body.includes('stay-old/b.pdf')));
});

test('send-push: správa recepcie → preklad (DeepL falošný) + push hosťovi; správa hosťa → preklad pre recepciu', async () => {
  process.env.DEEPL_KEY = 'x:fx';
  const own = fakeClient([[/^GET guest_stays/, [{ id: STAY.id, lang: 'uk', property_id: 'p_ic23' }]], [/^GET guest_links/, []]]);
  const deepl = async (url, init) => { const b = JSON.parse(init.body); return new Response(JSON.stringify({ translations: [{ detected_source_language: 'SK', text: '[' + b.target_lang + '] ' + b.text[0] }] }), { status: 200 }); };
  let res = await (await sendPush(post({ type: 'INSERT', table: 'guest_messages', record: { id: 'm1', stay_id: STAY.id, sender: 'reception', text: 'Deka je na recepcii.' } }), { own, fetchImpl: deepl })).json();
  assert.equal(res.translated, true);
  const patch = own.calls.find(c => c.method === 'PATCH' && c.path.startsWith('guest_messages'));
  assert.equal(patch.body.tr.uk, '[UK] Deka je na recepcii.'); assert.equal(patch.body.tr.en, '[EN-GB] Deka je na recepcii.');
  res = await (await sendPush(post({ record: { id: 'm2', stay_id: STAY.id, sender: 'guest', text: 'Потрібна ковдра', lang: 'uk' } }), { own, fetchImpl: deepl })).json();
  assert.equal(res.translated, true);
  delete process.env.DEEPL_KEY;
});
