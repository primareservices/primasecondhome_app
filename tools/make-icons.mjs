#!/usr/bin/env node
// Generuje PWA ikony bez externých knižníc: červený podklad (BRAND.red) a biela
// silueta domu ("second home"). Maskable varianty majú väčší okraj (safe zone).
// Spustenie: node tools/make-icons.mjs  → public/icon-*.png, apple-touch-icon.png, favicon-32.png
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RED = [0xBD, 0x24, 0x35], WHITE = [0xFF, 0xFF, 0xFF];
const root = fileURLToPath(new URL('../public/', import.meta.url));
mkdirSync(root, { recursive: true });

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
// Kreslenie: dom = trojuholníková strecha + telo + dvere. Súradnice v 0..1.
function house(u, v) {
  const roof = v >= 0.24 && v <= 0.5 && Math.abs(u - 0.5) <= (v - 0.24) / (0.5 - 0.24) * 0.32;
  const body = u >= 0.27 && u <= 0.73 && v >= 0.5 && v <= 0.78;
  const door = u >= 0.44 && u <= 0.56 && v >= 0.6 && v <= 0.78;
  const chimney = u >= 0.62 && u <= 0.69 && v >= 0.28 && v <= 0.5;
  return (roof || body || chimney) && !door;
}
function makeIcon(size, { maskable = false, radius = 0.22 } = {}) {
  const pad = maskable ? 0.14 : 0;   // maskable: obsah v strednej časti, okraje môžu byť odrezané
  return png(size, (x, y) => {
    const u = x / size, v = y / size;
    let bg = true;
    if (!maskable) {   // zaoblený štvorec, mimo neho priehľadné
      const r = radius, cx = Math.min(Math.max(u, r), 1 - r), cy = Math.min(Math.max(v, r), 1 - r);
      bg = Math.hypot(u - cx, v - cy) <= r;
    }
    if (!bg) return [0, 0, 0, 0];
    const uu = (u - pad) / (1 - 2 * pad), vv = (v - pad) / (1 - 2 * pad);
    const inside = uu >= 0 && uu <= 1 && vv >= 0 && vv <= 1 && house(uu, vv);
    return [...(inside ? WHITE : RED), 255];
  });
}
const files = {
  'icon-192.png': makeIcon(192), 'icon-512.png': makeIcon(512),
  'icon-maskable-192.png': makeIcon(192, { maskable: true }), 'icon-maskable-512.png': makeIcon(512, { maskable: true }),
  'apple-touch-icon.png': makeIcon(180, { maskable: true }), 'favicon-32.png': makeIcon(32, { radius: 0.3 }),
};
for (const [name, buf] of Object.entries(files)) { writeFileSync(root + name, buf); console.log('✓', name, buf.length, 'B'); }
