#!/usr/bin/env node
// PWA ikony z oficiálnej striešky PRIMA: červený gradient + biela strieška. Rasterizuje sa
// v Chromiu (Playwright, globálna inštalácia) — bez ďalších závislostí v projekte.
// Spustenie: NPM_GLOBAL_ROOT=$(npm root -g) node tools/make-icons.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire((process.env.NPM_GLOBAL_ROOT || '/usr/lib/node_modules') + '/');
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('../public/', import.meta.url));

const ROOF = '<path d="M113.53 26.51L340.17 136.39V109.87L140.88 13.26L113.53 26.51Z" fill="#FFFFFF" fill-opacity="0.72"/><path d="M101.7 5.74L0.459656 54.82V81.33L113.53 26.51L140.88 13.26L113.53 0L101.7 5.74Z" fill="#FFFFFF"/>';
// pad = okraj okolo striešky (maskable má väčší kvôli safe zone), radius = zaoblenie podkladu (0 = celý štvorec, OS ho oreže samo)
const icon = (pad, radius) => {
  const s = (512 - 2 * pad) / 341; const h = 137 * s; const y = (512 - h) / 2 + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E42A32"/><stop offset="1" stop-color="#8E1A28"/></linearGradient></defs><rect width="512" height="512" rx="${radius}" fill="url(#g)"/><g transform="translate(${pad} ${y}) scale(${s})">${ROOF}</g></svg>`;
};
const SPECS = [['icon-512.png', 512, 88, 0], ['icon-192.png', 192, 88, 0], ['icon-maskable-512.png', 512, 128, 0], ['icon-maskable-192.png', 192, 128, 0], ['apple-touch-icon.png', 180, 88, 0], ['favicon-32.png', 32, 64, 110]];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage();
for (const [name, size, pad, radius] of SPECS) {
  const svg = icon(pad, radius);
  const png = await page.evaluate(async ({ svg, size }) => {
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); await img.decode();
    const c = document.createElement('canvas'); c.width = size; c.height = size; c.getContext('2d').drawImage(img, 0, 0, size, size);
    return c.toDataURL('image/png').split(',')[1];
  }, { svg, size });
  writeFileSync(root + name, Buffer.from(png, 'base64'));
  console.log(name, size + 'px');
}
writeFileSync(root + 'favicon.svg', icon(64, 110));
await browser.close();
