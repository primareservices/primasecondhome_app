// Minimálne PDF z obrázkov strán (JPEG) bez knižníc — na podpísaný poriadok priamo v telefóne
// (offline, všetky písma vykreslí prehliadač na canvas). Server neskôr vyrobí textové PDF
// (edge funkcia sign-rules); toto je okamžitá kópia pre hosťa.
const A4 = { w: 595.28, h: 841.89 };
const enc = (s) => new TextEncoder().encode(s);
function dataUrlBytes(dataUrl) {
  const i = dataUrl.indexOf(','); const bin = atob(dataUrl.slice(i + 1));
  const out = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k); return out;
}
// pages: [{ jpeg: dataURL, width, height }] → Uint8Array PDF (každá strana = jeden obrázok na A4)
export function buildImagePdf(pages, { title = 'PRIMA SECOND HOME' } = {}) {
  const objects = [];   // Uint8Array | string
  const add = (o) => { objects.push(o); return objects.length; };
  const pageIds = [];
  const catalogId = 1, pagesId = 2; objects.push(null, null);   // rezervované
  const infoId = add(`<< /Title (${title.replace(/[()\\]/g, '')}) /Producer (PRIMA SECOND HOME) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`);
  for (const p of pages) {
    const bytes = dataUrlBytes(p.jpeg);
    const imgId = add({ head: `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`, stream: bytes });
    const content = `q ${A4.w.toFixed(2)} 0 0 ${A4.h.toFixed(2)} 0 0 cm /Im${imgId} Do Q`;
    const contentId = add({ head: `<< /Length ${enc(content).length} >>`, stream: enc(content) });
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im${imgId} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
  const parts = [enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
  const offsets = []; let pos = parts[0].length;
  const push = (u8) => { parts.push(u8); pos += u8.length; };
  objects.forEach((o, i) => {
    offsets.push(pos);
    push(enc(`${i + 1} 0 obj\n`));
    if (typeof o === 'string') push(enc(o + '\n'));
    else { push(enc(o.head + '\nstream\n')); push(o.stream); push(enc('\nendstream\n')); }
    push(enc('endobj\n'));
  });
  const xref = pos;
  push(enc(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')));
  push(enc(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
export function bytesToDataUrl(bytes, mime = 'application/pdf') {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return 'data:' + mime + ';base64,' + btoa(s);
}
export function dataUrlToBlob(dataUrl) {
  const m = /^data:([^;]+);base64,/.exec(dataUrl || '');
  return new Blob([dataUrlBytes(dataUrl)], { type: m ? m[1] : 'application/octet-stream' });
}
export async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}
