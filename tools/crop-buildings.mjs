#!/usr/bin/env node
// Z izometrickej ilustrácie všetkých budov (public/brand/prima-buildings.webp) vyreže jednotlivé
// prevádzky do public/brand/buildings/<qr>.webp — hlavička domova a karty Info. Rasterizuje sa cez
// canvas v Chromiu (Playwright, globálna inštalácia), bez závislostí v projekte.
// Spustenie: NPM_GLOBAL_ROOT=$(npm root -g) node tools/crop-buildings.mjs
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire((process.env.NPM_GLOBAL_ROOT || '/usr/lib/node_modules') + '/');
const { chromium } = require('playwright');
const pub = fileURLToPath(new URL('../public/', import.meta.url));
const SRC = pub + 'brand/prima-buildings.webp';
if (!existsSync(SRC)) { console.error('Chýba ' + SRC + ' — skopírujte ilustráciu login-buildings.webp z PRIMA TOOLS.'); process.exit(1); }
mkdirSync(pub + 'brand/buildings', { recursive: true });
// Relatívne súradnice výrezov (x0, y0, x1, y1) v ilustrácii 3:2.
const CROPS = {
  nitra:   [0.03, 0.12, 0.31, 0.56],
  tarif:   [0.29, 0.08, 0.75, 0.50],
  nukleon: [0.73, 0.03, 0.97, 0.55],
  ic15:    [0.06, 0.39, 0.39, 0.77],
  ic23:    [0.63, 0.41, 0.95, 0.81],
  galanta: [0.31, 0.60, 0.67, 0.89],
};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage();
const out = await page.evaluate(async ({ data, crops }) => {
  const img = new Image(); img.src = 'data:image/webp;base64,' + data; await img.decode();
  const res = {};
  for (const [k, [x0, y0, x1, y1]] of Object.entries(crops)) {
    const sx = Math.round(x0 * img.naturalWidth), sy = Math.round(y0 * img.naturalHeight);
    const sw = Math.round((x1 - x0) * img.naturalWidth), sh = Math.round((y1 - y0) * img.naturalHeight);
    const scale = Math.min(1, 1200 / sw);
    const c = document.createElement('canvas'); c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    res[k] = [c.toDataURL('image/webp', 0.86).split(',')[1], c.width, c.height];
  }
  return res;
}, { data: readFileSync(SRC).toString('base64'), crops: CROPS });
for (const [k, [b64, w, h]] of Object.entries(out)) {
  const buf = Buffer.from(b64, 'base64');
  writeFileSync(pub + 'brand/buildings/' + k + '.webp', buf);
  console.log(k + '.webp', w + 'x' + h, Math.round(buf.length / 1024) + ' kB');
}
await browser.close();
