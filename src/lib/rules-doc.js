// Vykreslenie podpísaného ubytovacieho poriadku na canvas (A4, 2 strany a viac): jazyk hosťa, potom
// slovensky, podpis, auditný blok. Prehliadač zvládne všetky písma (aj dévanágarí), preto ide o obrázky.
import { buildImagePdf } from './pdf.js';

const W = 1240, H = 1754, M = 96;   // A4 pri 150 dpi, okraj 16 mm
const RED = '#EE2A24', INK = '#333333', MUTED = '#6A6A6A', LINE = '#DADADA';
const FONT = "'Poppins', 'Montserrat', 'Noto Sans', system-ui, sans-serif";

function wrap(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW || !line) line = t; else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}
class Doc {
  constructor(meta) { this.meta = meta; this.pages = []; this.newPage(); }
  newPage() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    this.c = c; this.ctx = ctx; this.y = M; this.pages.push(c);
    this.header();
  }
  header() {
    const { ctx } = this;
    ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(M, M + 26); ctx.lineTo(M + 30, M); ctx.lineTo(M + 60, M + 26); ctx.lineTo(M + 30, M + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = RED; ctx.font = `800 26px ${FONT}`; ctx.fillText('PRIMA', M + 72, M + 22);
    ctx.fillStyle = MUTED; ctx.font = `600 12px ${FONT}`; ctx.fillText('YOUR SECOND HOME', M + 160, M + 22);
    ctx.fillStyle = MUTED; ctx.font = `500 12px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(this.meta.headerRight, W - M, M + 22); ctx.textAlign = 'left';
    ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, M + 44); ctx.lineTo(W - M, M + 44); ctx.stroke();
    this.y = M + 76;
  }
  ensure(h) { if (this.y + h > H - M) { this.footer(); this.newPage(); } }
  footer() {
    const { ctx } = this; ctx.fillStyle = '#9C9C9C'; ctx.font = `400 11px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(this.meta.footer + ' · ' + this.pages.length, W / 2, H - M / 2); ctx.textAlign = 'left';
  }
  text(str, { size = 15, weight = 400, color = INK, lh = 1.45, indent = 0, after = 6 } = {}) {
    this.ctx.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(this.ctx, str, W - 2 * M - indent);
    for (const l of lines) {
      this.ensure(size * lh);
      const ctx = this.ctx;   // po zlome strany je to už nový canvas — nikdy nedržať starý kontext
      ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.fillText(l, M + indent, this.y + size); this.y += size * lh;
    }
    this.y += after;
  }
  rule() { this.ensure(20); const { ctx } = this; ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, this.y + 8); ctx.lineTo(W - M, this.y + 8); ctx.stroke(); this.y += 20; }
}
function rulesSection(doc, rules, langName) {
  doc.ensure(60);
  doc.text(langName, { size: 20, weight: 700, color: '#B82025', after: 8 });
  if (rules.intro) doc.text(rules.intro, { size: 14, color: MUTED, after: 12 });
  if (Array.isArray(rules.items)) {
    rules.items.forEach((it, i) => { doc.text(`${i + 1}. ${it.title}`, { size: 15, weight: 700, after: 2 }); doc.text(it.text, { size: 14, indent: 26, after: 10 }); });
  } else if (Array.isArray(rules.sections)) {
    rules.sections.forEach((s, i) => { doc.text(`${i + 1}. ${s.title}`, { size: 15, weight: 700, after: 4 }); (s.items || []).forEach(x => doc.text('• ' + x, { size: 14, indent: 26, after: 4 })); doc.y += 8; });
  }
}
async function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }

// → { pages: [{ jpeg, width, height }], pdf: Uint8Array }
export async function renderSignedRules({ rulesGuest, rulesSk, lang, langName, property, stay, name, signedAt, version, signaturePng, appVersion, labels: given }) {
  const labels = { title: 'Súhlas s ubytovacím poriadkom', version: 'Verzia · Version', signature: 'Podpis hosťa · Guest signature', name: 'Meno · Name', room: 'Izba · Room', signed: 'Podpísané · Signed', checkIn: 'Príchod · Check-in', app: 'Aplikácia · App', footer: 'PRIMA SECOND HOME', legal: '', ...(given || {}) };
  const dt = new Date(signedAt);
  const meta = { headerRight: `${property ? property.name : ''} · ${labels.version} ${version}`, footer: labels.footer };
  const doc = new Doc(meta);
  doc.text(labels.title, { size: 26, weight: 800, after: 4 });
  doc.text(`${property ? property.name + ' · ' + property.street + ', ' + property.postal : ''}`, { size: 13, color: MUTED, after: 18 });
  rulesSection(doc, rulesGuest, langName);
  if (lang !== 'sk' && rulesSk) { doc.rule(); rulesSection(doc, rulesSk, 'Slovensky'); }
  // podpisový blok
  doc.ensure(300);
  doc.rule();
  doc.text(labels.signature, { size: 16, weight: 700, after: 8 });
  if (signaturePng) {
    try { const im = await loadImage(signaturePng); const h = 120, w = Math.round(im.width * (h / im.height)); doc.ctx.drawImage(im, M, doc.y, w, h); doc.y += h + 8; } catch {}
  }
  const rows = [[labels.name, name], [labels.room, stay.room], [labels.signed, dt.toLocaleString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })], [labels.checkIn, stay.checkIn || ''], [labels.version, version], [labels.app, appVersion]];
  for (const [k, v] of rows) { doc.ensure(24); doc.ctx.font = `400 13px ${FONT}`; doc.ctx.fillStyle = MUTED; doc.ctx.fillText(k, M, doc.y + 13); doc.ctx.font = `600 13px ${FONT}`; doc.ctx.fillStyle = INK; doc.ctx.fillText(String(v || ''), M + 260, doc.y + 13); doc.y += 22; }
  doc.y += 10; doc.text(labels.legal, { size: 11, color: '#9C9C9C', after: 0 });
  doc.footer();
  const pages = doc.pages.map(c => ({ jpeg: c.toDataURL('image/jpeg', 0.82), width: c.width, height: c.height }));
  return { pages, pdf: buildImagePdf(pages, { title: labels.title }) };
}
