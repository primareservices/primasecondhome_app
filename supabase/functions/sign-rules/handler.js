// Webhook z DB: INSERT do guest_signatures → PDF podpísaného ubytovacieho poriadku (Cloudflare Browser
// Rendering: HTML → PDF, správne písma aj pre hindčinu/nepálčinu) → privátny bucket guest-docs →
// e-mail hosťovi (Resend). Bez CF/Resend secrets funkcia len zapíše, čo chýba — appka ukáže PDF z telefónu.
import { checkWebhookSecret, cors, json, readJson } from '../_shared/http.js';
import { env } from '../_shared/env.js';
import { own as ownClient } from '../_shared/supa.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LANG_NAME = { sk: 'Slovensky', en: 'English', uk: 'Українська', ru: 'Русский', sr: 'Srpski', ro: 'Română', hu: 'Magyar', vi: 'Tiếng Việt', hi: 'हिन्दी', ne: 'नेपाली', uz: 'O‘zbekcha', tl: 'Filipino' };
const fmtDT = (iso) => new Date(iso).toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function rulesBlock(rules, lang) {
  if (!rules) return '';
  const items = Array.isArray(rules.items) ? rules.items.map((it, i) => `<li><b>${esc(it.title)}</b><div>${esc(it.text)}</div></li>`).join('')
    : (rules.sections || []).map((s, i) => `<li><b>${esc(s.title)}</b><ul>${(s.items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('');
  return `<section lang="${esc(lang)}"><h2>${esc(LANG_NAME[lang] || lang)}</h2>${rules.intro ? `<p class="intro">${esc(rules.intro)}</p>` : ''}<ol>${items}</ol></section>`;
}
// HTML dokumentu: jazyk hosťa, potom slovensky; podpisový blok s auditnou stopou.
export function rulesHtml({ stay, property, version, texts, lang, signaturePng, sig, appVersion }) {
  const guest = texts && texts[lang] ? texts[lang] : (texts && texts.en);
  const sk = texts && texts.sk;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Ubytovací poriadok – podpis</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 18mm 16mm 20mm; }
body { font-family: 'Noto Sans', 'Noto Sans Devanagari', Arial, sans-serif; color: #333; font-size: 11.5px; line-height: 1.45; }
header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #EE2A24; padding-bottom: 10px; margin-bottom: 14px; }
header .brand { font-weight: 700; font-size: 18px; color: #EE2A24; letter-spacing: .02em; } header .sub { font-size: 10px; color: #6A6A6A; letter-spacing: .12em; }
h1 { font-size: 17px; margin: 0 0 4px; } .meta { color: #6A6A6A; font-size: 10.5px; margin-bottom: 12px; }
h2 { font-size: 13px; margin: 14px 0 6px; color: #B82025; } .intro { background: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 6px; padding: 8px 10px; }
ol { padding-left: 18px; } ol > li { margin: 0 0 6px; } ol ul { padding-left: 16px; margin: 2px 0; }
.sign { margin-top: 18px; border: 1px solid #DADADA; border-radius: 8px; padding: 12px 14px; page-break-inside: avoid; }
.sign img { height: 70px; display: block; margin: 6px 0; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 10.5px; }
.grid b { color: #6A6A6A; font-weight: 400; } footer { margin-top: 12px; font-size: 9px; color: #9C9C9C; }
</style></head><body>
<header><svg width="46" height="24" viewBox="0 0 341 137"><path fill="#EE2A24" d="M0 137 170 0l171 137-171-99z"/></svg><div><div class="brand">PRIMA</div><div class="sub">YOUR SECOND HOME</div></div></header>
<h1>Súhlas s ubytovacím poriadkom · House rules acknowledgement</h1>
<div class="meta">${esc(property ? property.name : stay.property_id)} · ${esc(property ? property.address : '')} · verzia poriadku ${esc(version)}</div>
${rulesBlock(guest, lang)}
${lang !== 'sk' ? rulesBlock(sk, 'sk') : ''}
<div class="sign">
  <div><b>Podpis hosťa · Guest signature</b></div>
  ${signaturePng ? `<img src="${signaturePng}" alt="podpis">` : '<div style="height:70px"></div>'}
  <div class="grid">
    <div><b>Meno · Name:</b> ${esc(sig.name || stay.display_name || '')}</div><div><b>Izba · Room:</b> ${esc(stay.room)}</div>
    <div><b>Podpísané · Signed:</b> ${esc(fmtDT(sig.signed_at))} (Europe/Bratislava)</div><div><b>Pobyt od · Check-in:</b> ${esc(stay.check_in || '')}</div>
    <div><b>ID dokumentu:</b> ${esc(sig.id)}</div><div><b>Jazyk · Language:</b> ${esc(LANG_NAME[lang] || lang)}</div>
  </div>
</div>
<footer>Jednoduchý elektronický podpis (eIDAS SES) zaznamenaný v aplikácii PRIMA SECOND HOME ${esc(appVersion || '')}. Auditná stopa (čas, zariadenie, verzia poriadku) je uložená k dokumentu.</footer>
</body></html>`;
}

export async function renderPdf(html, { fetchImpl } = {}) {
  const account = env('CF_ACCOUNT_ID'), token = env('CF_API_TOKEN');
  if (!account || !token) return null;
  const f = fetchImpl || ((...a) => fetch(...a));
  const r = await f('https://api.cloudflare.com/client/v4/accounts/' + account + '/browser-rendering/pdf', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ html, gotoOptions: { waitUntil: 'networkidle0' } }) });
  if (!r.ok) throw new Error('pdf_render_failed_' + r.status);
  return new Uint8Array(await r.arrayBuffer());
}
export async function sendMail({ to, subject, html, attachment }, { fetchImpl } = {}) {
  const key = env('RESEND_API_KEY'), from = env('MAIL_FROM', 'PRIMA SECOND HOME <noreply@primare.sk>');
  if (!key || !to) return false;
  const f = fetchImpl || ((...a) => fetch(...a));
  const body = { from, to: [to], subject, html };
  if (attachment) body.attachments = [{ filename: attachment.filename, content: attachment.base64 }];
  const r = await f('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.ok;
}
const toB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const sha256hex = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');

export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  const body = await readJson(req);
  const sig = body && (body.record || body);
  if (!sig || !sig.id || !sig.stay_id) return json({ error: 'bad_record' }, 400);
  if (sig.pdf_path) return json({ skipped: 'already_rendered' });
  const own = deps.own || ownClient();
  const stay = (await own.rest('guest_stays?select=*&id=eq.' + sig.stay_id))[0];
  if (!stay) return json({ error: 'stay_not_found' }, 404);
  const property = (await own.rest('properties?select=id,name,address&id=eq.' + encodeURIComponent(stay.property_id)))[0] || null;
  const rulesRows = await own.rest('rules?select=version,texts,property_id&version=eq.' + encodeURIComponent(sig.version) + '&or=(property_id.eq.' + encodeURIComponent(stay.property_id) + ',property_id.is.null)&order=property_id.desc.nullslast&limit=1');
  const texts = rulesRows[0] ? rulesRows[0].texts : null;
  const lang = sig.lang || stay.lang || 'en';
  let signaturePng = null;
  if (sig.signature_path) { try { const bytes = await own.download('guest-docs', sig.signature_path); signaturePng = 'data:image/png;base64,' + toB64(bytes); } catch {} }
  const html = rulesHtml({ stay, property, version: sig.version, texts, lang, signaturePng, sig, appVersion: sig.audit && sig.audit.app_version });
  const pdf = await renderPdf(html, { fetchImpl: deps.fetchImpl });
  const out = { ok: true, pdf: !!pdf, email: false, rules: !!texts };
  if (pdf) {
    const path = stay.id + '/poriadok-' + String(sig.version).replace(/[^A-Za-z0-9._-]/g, '_') + '-' + sig.id + '.pdf';
    await own.upload('guest-docs', path, pdf, 'application/pdf');
    const hash = await sha256hex(pdf);
    await own.rest('guest_signatures?id=eq.' + sig.id, { method: 'PATCH', body: { pdf_path: path, sha256: hash }, prefer: 'return=minimal' });
    out.path = path;
    const to = sig.email || stay.email;
    if (to) {
      const sent = await sendMail({ to, subject: 'PRIMA – podpísaný ubytovací poriadok / signed house rules', html: '<p>Ďakujeme. V prílohe je váš podpísaný ubytovací poriadok.<br>Thank you. Your signed house rules are attached.</p>', attachment: { filename: 'PRIMA-ubytovaci-poriadok.pdf', base64: toB64(pdf) } }, { fetchImpl: deps.fetchImpl });
      if (sent) { await own.rest('guest_signatures?id=eq.' + sig.id, { method: 'PATCH', body: { email_sent_at: new Date().toISOString() }, prefer: 'return=minimal' }); out.email = true; }
    }
  }
  return json(out);
}
