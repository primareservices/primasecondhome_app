import { useEffect, useState } from 'react';
import { IconBox } from './primitives.jsx';

// Brandové obrázky PRIMA. Ilustrácia všetkých budov (public/brand/prima-buildings.webp) je tá istá,
// ktorú používa prihlásenie PRIMA TOOLS a PRIMA RE SERVICE; výrezy jednotlivých budov
// (public/brand/buildings/<qr>.webp) z nej vyrába tools/crop-buildings.mjs a malé náhľady prevádzok
// sú v public/prevadzky/<qr>.jpg. Keď súbor chýba, komponent sa ticho stiahne a obrazovka použije
// záložný vzhľad (vínový hero, ikona budovy) — appka nikdy neukáže rozbitý obrázok.
export const BRAND_ART = '/brand/prima-buildings.webp';
export const buildingArt = (p) => (p && p.qr ? '/brand/buildings/' + String(p.qr).toLowerCase() + '.webp' : null);
export const buildingThumb = (p) => (p && p.qr ? '/prevadzky/' + String(p.qr).toLowerCase() + '.jpg' : null);

const cache = new Map();
export function useBrandImage(src) {
  const [ok, setOk] = useState(() => !!(src && cache.get(src)));
  useEffect(() => {
    if (!src) return undefined;
    if (cache.has(src)) { setOk(cache.get(src)); return undefined; }
    let alive = true;
    const img = new Image();
    img.onload = () => { cache.set(src, true); if (alive) setOk(true); };
    img.onerror = () => { cache.set(src, false); if (alive) setOk(false); };
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return ok;
}
// Výrez budovy hosťa ako hlavička karty (svetlé modrosivé pozadie ako na prihlásení).
export function BuildingArt({ property, height = 176, position = 'center 40%', style }) {
  const src = buildingArt(property);
  const ok = useBrandImage(src);
  if (!ok) return null;
  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', background: '#EEF1F5', ...style }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, display: 'block' }}/>
    </div>
  );
}
// Malý náhľad prevádzky v riadku; bez súboru ikona budovy.
export function BuildingThumb({ property, size = 46, radius = 16 }) {
  const src = buildingThumb(property);
  const ok = useBrandImage(src);
  if (!ok) return <IconBox name="Building2" size={size} radius={radius}/>;
  return <img src={src} alt="" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, background: '#EEF1F5' }}/>;
}
