// Runtime harness modulu Hostia (TOOLS): mock Supabase projektu hostí cez page.route, prejde všetky panely, spraví screenshoty.
// Použitie (viď ../README.md §5): SCR=<kópia TOOLS s modulom a harness súbormi> OUT=<priečinok na screenshoty> NPM_GLOBAL_ROOT=<kde je playwright> node hostia-harness.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(process.env.NPM_GLOBAL_ROOT + '/');
const { chromium } = require('playwright');
const SCR = process.env.SCR, OUT = process.env.OUT; mkdirSync(OUT, { recursive: true });
const PORT = 4192,   // pozor: 4190 je v zozname „bad ports“ (fetch aj Chromium ho odmietnu)
   BASE = `http://localhost:${PORT}/hostia.html`, SUPA = 'https://example.supabase.co';
const server = spawn(SCR + '/node_modules/.bin/vite', ['preview', '--config', 'vite.hostia.config.js', '--port', String(PORT), '--strictPort'], { cwd: SCR, stdio: ['ignore', 'ignore', 'inherit'] });
server.on('exit', (c) => console.log('preview exited', c)); server.on('error', (e) => console.log('preview spawn error', e.message));
const up = async () => { for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE); if (r.ok) return true; } catch {} await sleep(250); } return false; };

// ── mock dáta ─────────────────────────────────────────────────────────────────────
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const now = Math.floor(Date.now() / 1000);
const user = { id: 'u-office-1', aud: 'authenticated', role: 'authenticated', email: 'recepcia@primare.sk', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-09-01T08:00:00Z' };
const jwt = b64u({ alg: 'HS256', typ: 'JWT' }) + '.' + b64u({ sub: user.id, role: 'authenticated', aud: 'authenticated', email: user.email, iat: now, exp: now + 3600 }) + '.sig';
const session = { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r-1', user };
const office = [{ uid: user.id, email: user.email, name: 'Recepcia IC 23', role: 'admin', property_ids: ['p_ic23'], active: true }];
const properties = [['p_galanta', 'PRIMA Galanta'], ['p_ic15', 'PRIMA IC 15'], ['p_ic23', 'PRIMA IC 23'], ['p_nitra', 'PRIMA Nitra'], ['p_nukleon', 'PRIMA Nukleon'], ['p_tarif', 'PRIMA Tarif']].map(([id, name]) => ({ id, name }));
const stayOf = (id) => stays.find(s => s.id === id);
const embed = (s) => ({ id: s.id, room: s.room, display_name: s.display_name, property_id: s.property_id, client_company: s.client_company, lang: s.lang });
const signatures = [{ stay_id: 's1', signed_at: '2026-09-01T15:12:00Z', pdf_path: 's1/rules-2026-09.pdf', email_sent_at: '2026-09-01T15:13:00Z' }];
const identity = [{ stay_id: 's1', status: 'approved', checked_at: '2026-09-01T15:20:00Z' }, { stay_id: 's3', status: 'pending', checked_at: null }];
const T = (h) => new Date(Date.now() - h * 3600e3).toISOString();
let stays; let requests; let messages; let announcements;
function resetData() {
stays = [
  { id: 's1', property_id: 'p_ic23', room: '111/2', surname_prefix: 'kov', display_name: 'Oleksandr K.', client_company: 'Jaguar Land Rover', check_in: '2026-09-01', check_out: '2026-11-30', lang: 'uk', email: 'o.kovalenko@example.com', closed_at: null },
  { id: 's2', property_id: 'p_ic23', room: '214', surname_prefix: 'she', display_name: 'Iryna S.', client_company: 'Schaeffler', check_in: '2026-09-03', check_out: null, lang: 'uk', email: null, closed_at: null },
  { id: 's3', property_id: 'p_ic23', room: '325/1', surname_prefix: 'sha', display_name: 'Rajesh S.', client_company: 'Jaguar Land Rover', check_in: '2026-09-05', check_out: '2027-03-05', lang: 'hi', email: null, closed_at: null },
  { id: 's4', property_id: 'p_tarif', room: 'B214', surname_prefix: 'ngu', display_name: 'Minh N.', client_company: 'Samsung', check_in: '2026-08-20', check_out: '2026-12-20', lang: 'vi', email: null, closed_at: null },
];
requests = [
  { id: 'r1', ref: 'H-1041', stay_id: 's1', kind: 'issue', category: 'Voda', room: '111/2', payload: {}, text: 'Тече кран у ванній', text_sk: 'Tečie kohútik v kúpeľni', status: 'assigned', timeline: [], external_ref: 'G-7f3a2c', created_at: T(5), guest_stays: embed(stayOf('s1')) },
  { id: 'r2', ref: 'H-1042', stay_id: 's2', kind: 'service', service: 'Práčovňa — pranie', payload: { bags: 2, slot: 'utorok 18:00' }, text: null, text_sk: null, status: 'reported', timeline: [], external_ref: null, created_at: T(3), guest_stays: embed(stayOf('s2')) },
  { id: 'r3', ref: 'H-1043', stay_id: 's3', kind: 'document', service: 'Potvrdenie o ubytovaní', payload: { purpose: 'cudzinecká polícia' }, text: null, status: 'inProgress', timeline: [{ at: T(2), status: 'inProgress' }], external_ref: null, created_at: T(2.5), guest_stays: embed(stayOf('s3')) },
  { id: 'r4', ref: 'H-1044', stay_id: 's1', kind: 'private', category: 'Spolubývajúci', payload: { anonymous: true }, text: 'Сусід курить у кімнаті', text_sk: 'Spolubývajúci fajčí v izbe', status: 'received', timeline: [], external_ref: null, created_at: T(1), guest_stays: embed(stayOf('s1')) },
  { id: 'r5', ref: 'H-1039', stay_id: 's2', kind: 'service', service: 'Výmena posteľnej bielizne', payload: {}, text: null, status: 'resolved', timeline: [], external_ref: null, created_at: T(30), guest_stays: embed(stayOf('s2')) },
];
messages = [
  { id: 'm1', stay_id: 's1', sender: 'guest', text: 'Добрий день, чи можна отримати другий ключ від кімнати?', tr: { sk: 'Dobrý deň, je možné dostať druhý kľúč od izby?', en: 'Hello, could I get a second room key?' }, lang: 'uk', created_at: T(4), read_at: null, guest_stays: embed(stayOf('s1')) },
  { id: 'm2', stay_id: 's1', sender: 'reception', text: 'Dobrý deň, áno — príďte na recepciu po 14:00.', tr: { uk: 'Добрий день, так — приходьте на рецепцію після 14:00.', en: 'Hello, yes — come to the reception after 2 pm.' }, lang: 'sk', created_at: T(3.5), read_at: T(3), guest_stays: embed(stayOf('s1')) },
  { id: 'm3', stay_id: 's1', sender: 'guest', text: 'Дякую!', tr: { sk: 'Ďakujem!', en: 'Thank you!' }, lang: 'uk', created_at: T(3.2), read_at: null, guest_stays: embed(stayOf('s1')) },
  { id: 'm4', stay_id: 's3', sender: 'guest', text: 'कृपया बताएं कि कपड़े धोने की मशीन कैसे बुक करें', tr: { sk: 'Prosím, povedzte mi, ako si rezervovať práčku', en: 'Please tell me how to book the washing machine' }, lang: 'hi', created_at: T(1.2), read_at: null, guest_stays: embed(stayOf('s3')) },
];
announcements = [
  { id: 'a1', property_id: 'p_ic23', severity: 'warning', texts: { sk: { title: 'Odstávka teplej vody', body: 'V utorok 16. 9. od 9:00 do 13:00 nepôjde teplá voda (výmena ventilov).' }, en: { title: 'Hot water outage', body: 'On Tuesday 16 Sep from 9:00 to 13:00 there will be no hot water (valve replacement).' }, uk: { title: 'Відключення гарячої води', body: 'У вівторок 16.09 з 9:00 до 13:00 не буде гарячої води.' } }, valid_from: T(20), valid_to: new Date(Date.now() + 48 * 3600e3).toISOString(), pushed_at: T(20), created_at: T(20) },
  { id: 'a2', property_id: null, severity: 'info', texts: { sk: { title: 'Nová aplikácia PRIMA SECOND HOME', body: 'Poruchy, práčovňu a doklady vybavíte v mobile. Kód dostanete na recepcii.' }, en: { title: 'New PRIMA SECOND HOME app', body: 'Report issues, book laundry and request documents from your phone.' } }, valid_from: T(200), valid_to: null, pushed_at: T(200), created_at: T(200) },
];
}
resetData();
let seq = 0;
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '0-9/*' }, body: JSON.stringify(body) });
const calls = [];
async function mock(route) {
  const req = route.request(); const url = new URL(req.url()); const m = req.method(); const p = url.pathname;
  calls.push(m + ' ' + p + (url.search ? url.search.slice(0, 80) : ''));
  if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  if (p === '/auth/v1/token') { const b = req.postDataJSON(); if (b.password !== 'tajne') return json(route, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 400, msg: 'Invalid login credentials' }, 400); return json(route, session); }
  if (p === '/auth/v1/user') return json(route, user);
  if (p === '/auth/v1/logout') return json(route, {}, 204);
  const body = () => { try { return req.postDataJSON(); } catch { return null; } };
  const filt = (rows, key) => { const v = url.searchParams.get(key); if (!v) return rows; const [op, val] = v.split('.'); if (op === 'eq') return rows.filter(r => String(r[key]) === val); if (op === 'in') return rows.filter(r => val.replace(/[()]/g, '').split(',').includes(String(r[key]))); if (op === 'is') return rows.filter(r => r[key] == null); return rows; };
  const gsProp = (rows) => { const v = url.searchParams.get('guest_stays.property_id'); if (!v) return rows; const val = v.split('.')[1]; return rows.filter(r => r.guest_stays.property_id === val); };
  if (p === '/rest/v1/office_users') return json(route, office);
  if (p === '/rest/v1/properties') return json(route, properties);
  if (p === '/rest/v1/guest_stays') { if (m === 'PATCH') { const b = body(); const id = url.searchParams.get('id').split('.')[1]; Object.assign(stayOf(id) || {}, b); return json(route, []); } return json(route, filt(filt(stays, 'property_id'), 'closed_at')); }
  if (p === '/rest/v1/guest_signatures') return json(route, filt(signatures, 'stay_id'));
  if (p === '/rest/v1/guest_identity') return json(route, filt(identity, 'stay_id'));
  if (p === '/rest/v1/guest_requests') { if (m === 'PATCH') { const b = body(); const id = url.searchParams.get('id').split('.')[1]; Object.assign(requests.find(r => r.id === id), b); return json(route, []); } return json(route, gsProp(requests)); }
  if (p === '/rest/v1/guest_messages') {
    if (m === 'POST') { const b = body(); const st = stayOf(b.stay_id); messages.push({ id: 'm' + (++seq + 10), ...b, tr: {}, created_at: new Date().toISOString(), read_at: null, guest_stays: embed(st) }); return json(route, [], 201); }
    if (m === 'PATCH') { const ids = url.searchParams.get('id').replace(/^in\.\(|\)$/g, '').split(','); for (const x of messages) if (ids.includes(x.id)) x.read_at = new Date().toISOString(); return json(route, []); }
    return json(route, gsProp(messages));
  }
  if (p === '/rest/v1/guest_announcements') {
    if (m === 'POST') { const b = body(); const row = { ...b, id: b.id || 'a' + (++seq + 10), created_at: new Date().toISOString(), pushed_at: null }; const i = announcements.findIndex(a => a.id === row.id); if (i >= 0) announcements[i] = { ...announcements[i], ...row }; else announcements.unshift(row); return json(route, row, 201); }
    if (m === 'DELETE') { const id = url.searchParams.get('id').split('.')[1]; announcements = announcements.filter(a => a.id !== id); return json(route, [], 204); }
    const or = url.searchParams.get('or'); const pid = or && /property_id\.eq\.([^,)]+)/.exec(or); return json(route, pid ? announcements.filter(a => !a.property_id || a.property_id === pid[1]) : announcements);
  }
  if (p === '/rest/v1/rpc/office_create_stay') { const b = body(); const id = 'n' + (++seq); stays.push({ id, property_id: b.p_property, room: b.p_room, surname_prefix: 'xxx', display_name: b.p_display_name, client_company: b.p_company, check_in: b.p_check_in, check_out: b.p_check_out, lang: b.p_lang, email: b.p_email, closed_at: null }); return json(route, { id, code: b.p_code }); }
  if (p === '/rest/v1/rpc/office_issue_code') { const b = body(); return json(route, b.p_code); }
  if (p === '/functions/v1/translate') { const b = body(); const out = { src: 'sk' }; for (const t of b.targets) out[t] = `[${t.toUpperCase()}] ${b.text}`; return json(route, out); }
  if (p.startsWith('/storage/v1/object/sign/')) return json(route, { signedURL: '/object/sign/' + p.split('/object/sign/')[1] + '?token=mock' });
  console.log('UNMOCKED', m, p, url.search.slice(0, 120));
  return json(route, { message: 'unmocked ' + p }, 404);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const fails = [];
async function shot(page, name) { const h = await page.evaluate(() => { const m = document.querySelector('.zam-modal'); return Math.max(document.documentElement.scrollHeight, m ? m.scrollHeight + 120 : 0, 600); }); const vp = page.viewportSize(); await page.setViewportSize({ width: vp.width, height: Math.min(h, 2200) }); await sleep(120); await page.screenshot({ path: `${OUT}/${name}.png` }); await page.setViewportSize(vp); console.log('shot', name, vp.width + 'x' + Math.min(h, 2200)); }
async function run(label, vp) {
  resetData();
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: vp.width < 600 ? 2 : 1, isMobile: vp.width < 600, hasTouch: vp.width < 600, locale: 'sk-SK', timezoneId: 'Europe/Bratislava' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
  page.on('console', msg => { if (msg.type() === 'error' && !/status of 400/.test(msg.text())) errors.push('console: ' + msg.text().slice(0, 200)); });   // 400 = zámerne zlé heslo
  page.on('dialog', d => d.accept());
  await page.route(SUPA + '/**', mock);
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Prihlásiť sa' }).waitFor({ timeout: 15000 });
  await shot(page, `${label}-01-login`);
  // zlé heslo → chyba
  await page.getByLabel('E-mail').fill('recepcia@primare.sk'); await page.getByLabel('Heslo').fill('zle'); await page.getByRole('button', { name: 'Prihlásiť sa' }).click();
  await page.getByText(/Invalid login/).waitFor({ timeout: 8000 });
  await page.getByLabel('Heslo').fill('tajne'); await page.getByRole('button', { name: 'Prihlásiť sa' }).click();
  await page.getByRole('cell', { name: '111/2' }).first().waitFor({ timeout: 15000 });
  await page.getByRole('cell', { name: 'B214' }).first().waitFor({ timeout: 8000 });    // admin → všetky budovy
  await sleep(300);
  await shot(page, `${label}-02-pobyty`);
  // filter budovy
  await page.locator('select').first().selectOption('p_ic23');
  await sleep(400);
  if (await page.getByRole('cell', { name: 'B214' }).count()) fails.push('filter budovy nefunguje');
  // vyhľadávanie
  await page.getByPlaceholder('Izba, meno, firma…').fill('schaeffler');
  await sleep(200);
  if (await page.getByRole('cell', { name: '111/2' }).count()) fails.push('search nefiltruje');
  await page.getByPlaceholder('Izba, meno, firma…').fill('');
  // lístok (nový kód) pre prvý riadok
  await page.getByRole('button', { name: /Lístok/ }).first().click();
  await page.getByText('Lístok pre hosťa').waitFor({ timeout: 8000 });
  await page.locator('.hostia-slip img[alt="QR"]').first().waitFor({ timeout: 8000 });
  const codeTxt = await page.locator('.hostia-slip').first().innerText();
  if (!/IC23-[A-Z2-9]{6}/.test(codeTxt)) fails.push('kód na lístku nemá tvar IC23-XXXXXX: ' + codeTxt.slice(0, 80));
  if (!/home\.primare\.sk\/#\/welcome\?step=code&c=IC23-/.test(codeTxt)) fails.push('URL na lístku chýba');
  await sleep(200);
  await shot(page, `${label}-03-listok`);
  await page.getByRole('button', { name: 'Tlačiť' }).click();
  if (!(await page.evaluate(() => window.__printed))) fails.push('print sa nezavolal');
  await page.getByRole('button', { name: 'Zavrieť' }).click();
  // podpísané PDF → signed URL → window.open
  await page.getByRole('button', { name: /1\. 9\. 2026/ }).first().click();
  await sleep(400);
  const opened = await page.evaluate(() => window.__opened);
  if (!opened.some(u => /guest-docs\/s1\/rules-2026-09\.pdf/.test(u))) fails.push('PDF podpisu sa neotvoril: ' + JSON.stringify(opened));
  // nový pobyt
  await page.getByRole('button', { name: 'Nový pobyt' }).click();
  await page.getByText('Založiť a vydať kód').waitFor();
  await page.getByLabel(/^Izba/).fill('118/1'); await page.getByLabel('Priezvisko').fill('Petrenko'); await page.getByLabel(/^Meno$/).fill('Andrii'); await page.getByLabel('Firma (klient)').fill('Schaeffler');
  await shot(page, `${label}-04-novy-pobyt`);
  await page.getByRole('button', { name: 'Založiť a vydať kód' }).click();
  await page.getByText('Lístok pre hosťa').waitFor({ timeout: 8000 });
  const t2 = await page.locator('.hostia-slip').first().innerText();
  if (!/Andrii P\./.test(t2) || !/118\/1/.test(t2)) fails.push('lístok nového pobytu: ' + t2.slice(0, 100));
  await page.getByRole('button', { name: 'Zavrieť' }).click();
  await page.getByRole('cell', { name: '118/1' }).first().waitFor({ timeout: 8000 });
  // import z exportu
  await page.getByRole('button', { name: 'Import z exportu' }).click();
  await page.getByText('Mesačný XLSX export').waitFor();
  await page.locator('input[type=file]').setInputFiles(SCR + '/export-hostia.xlsx');
  await page.getByText('3 hostí, 1 riadkov bez mena alebo izby preskočených.').waitFor({ timeout: 8000 });
  await sleep(200);
  await shot(page, `${label}-05-import`);
  await page.getByRole('button', { name: /Založiť vybraných \(3\)/ }).click();
  await page.getByText('Lístky pre 3 hostí').waitFor({ timeout: 10000 });
  await page.locator('.hostia-slip img[alt="QR"]').nth(2).waitFor({ timeout: 8000 });
  await sleep(200);
  await shot(page, `${label}-06-listky-hromadne`);
  await page.getByRole('button', { name: 'Zavrieť' }).click();
  await page.getByRole('cell', { name: '325/1' }).first().waitFor({ timeout: 8000 });
  // žiadosti
  await page.getByRole('button', { name: 'Žiadosti' }).click();
  await page.getByText('H-1042').waitFor({ timeout: 8000 });
  if (await page.getByText('H-1039').count()) fails.push('vyriešená žiadosť sa zobrazuje v Otvorených');
  await sleep(200);
  await shot(page, `${label}-07-ziadosti`);
  const card = page.locator('text=H-1042').locator('xpath=ancestor::div[contains(@style,"margin-bottom")][1]');
  await card.locator('select').selectOption('inProgress');
  await card.getByPlaceholder('Poznámka pre hosťa (SK, preloží sa)').fill('Vrecia vyzdvihneme dnes o 18:00.');
  await card.getByRole('button', { name: 'Uložiť' }).click();
  await sleep(500);
  const r2 = requests.find(r => r.id === 'r2');
  if (r2.status !== 'inProgress' || !r2.timeline.length || r2.timeline[0].note.sk !== 'Vrecia vyzdvihneme dnes o 18:00.') fails.push('PATCH žiadosti: ' + JSON.stringify(r2.timeline));
  await page.getByRole('button', { name: 'Všetky' }).click();
  await page.getByText('H-1039').waitFor({ timeout: 8000 });
  // správy
  await page.getByRole('button', { name: 'Správy' }).click();
  await page.getByText('Ďakujem!').first().waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: /111\/2/ }).first().click();
  await page.getByText('originál: Дякую!').waitFor({ timeout: 8000 });
  await sleep(400);
  if (messages.filter(x => x.stay_id === 's1' && x.sender === 'guest' && !x.read_at).length) fails.push('správy hosťa sa neoznačili ako prečítané');
  await page.getByPlaceholder(/Odpoveď/).fill('Kľúč je pripravený na recepcii.');
  await page.getByRole('button', { name: 'Odoslať' }).click();
  await page.getByText('Kľúč je pripravený na recepcii.').first().waitFor({ timeout: 8000 });
  await sleep(200);
  await shot(page, `${label}-08-spravy`);
  // oznamy
  await page.getByRole('button', { name: 'Oznamy' }).click();
  await page.getByText('Odstávka teplej vody').waitFor({ timeout: 8000 });
  await sleep(200);
  await shot(page, `${label}-09-oznamy`);
  await page.getByRole('button', { name: 'Nový oznam' }).click();
  await page.getByLabel('Nadpis (SK)').fill('Kontrola hasiacich prístrojov');
  await page.getByLabel('Text (SK)').fill('Vo štvrtok 18. 9. od 8:00 prejde technik všetky chodby. Izby netreba sprístupniť.');
  await page.getByRole('button', { name: /Preložiť/ }).click();
  await page.getByPlaceholder('Українська — nadpis').waitFor({ timeout: 8000 });
  const ukTitle = await page.getByPlaceholder('Українська — nadpis').inputValue();
  if (ukTitle !== '[UK] Kontrola hasiacich prístrojov') fails.push('preklad oznamu: ' + ukTitle);
  await sleep(200);
  await shot(page, `${label}-10-novy-oznam`);
  await page.getByRole('button', { name: 'Uložiť a poslať push' }).click();
  await page.getByText('Kontrola hasiacich prístrojov').first().waitFor({ timeout: 8000 });
  const saved = announcements.find(a => a.texts.sk.title === 'Kontrola hasiacich prístrojov');
  if (!saved || Object.keys(saved.texts).length !== 7 || saved.property_id !== 'p_ic23') fails.push('uložený oznam: ' + JSON.stringify(saved && { pid: saved.property_id, langs: Object.keys(saved.texts) }));
  // odhlásenie
  await page.locator('button:has(svg.lucide-log-out)').first().click();
  await page.getByRole('button', { name: 'Prihlásiť sa' }).waitFor({ timeout: 8000 });
  if (errors.length) { console.log(label, 'errors:'); for (const e of errors) console.log('  ', e); fails.push(label + ': ' + errors.length + ' JS errors'); }
  await ctx.close();
}
try {
  if (!(await up())) throw new Error('preview server did not start');
  await run('desktop', { width: 1280, height: 860 });
  await run('mobile', { width: 390, height: 844 });
  console.log('calls:', calls.length, 'unique:', [...new Set(calls.map(c => c.split('?')[0]))].length);
  if (fails.length) { console.log('FAILS:'); for (const f of fails) console.log(' -', f); process.exitCode = 1; } else console.log('HARNESS OK');
} finally { await browser.close(); server.kill(); }
