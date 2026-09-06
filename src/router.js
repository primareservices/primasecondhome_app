// Hash router bez závislosti (rovnaký prístup ako PRIMA TOOLS: #/adresar?f=<id>).
// Hash prežije PWA start_url aj single-page fallback na Cloudflare.
import { useEffect, useState } from 'react';

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const path = '/' + pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
  const segs = path === '/' ? [] : path.slice(1).split('/').map(decodeURIComponent);
  return { path, segs, query: new URLSearchParams(queryPart || '') };
}
export function navigate(path, { replace = false } = {}) {
  const next = '#' + (path.startsWith('/') ? path : '/' + path);
  if (replace) { try { window.history.replaceState(null, '', next); window.dispatchEvent(new HashChangeEvent('hashchange')); return; } catch (e) {} }
  window.location.hash = next;
}
export function back(fallback = '/') {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}
export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => { setRoute(parseHash(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
