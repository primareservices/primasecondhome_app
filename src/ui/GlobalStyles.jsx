import { BRAND, C } from '../config/theme.js';

export function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; background: ${C.bg}; color: ${C.text}; }
      button { font-family: inherit; cursor: pointer; }
      input, textarea, select { font-family: inherit; }
      input:focus, textarea:focus, select:focus, button:focus-visible { outline: none; box-shadow: ${C.focusRing}; border-color: ${BRAND.red}; }
      textarea { resize: vertical; }
      a { color: ${C.infoText}; }
      .page { max-width: 640px; margin: 0 auto; padding: 12px 14px calc(84px + env(safe-area-inset-bottom)); }
      .page-nonav { padding-bottom: 32px; }
      .fade-in { animation: fadeIn .22s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg) } }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .grid-cats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
      @media (min-width: 480px) { .grid-cats { grid-template-columns: repeat(3, 1fr); } }
      .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
      .chips::-webkit-scrollbar { display: none; }
      .bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; background: ${C.card}; border-top: 1px solid ${C.border};
        padding-bottom: env(safe-area-inset-bottom); }
      .bottom-nav-inner { max-width: 640px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
      .nav-btn { background: none; border: none; padding: 8px 4px 8px; display: flex; flex-direction: column; align-items: center; gap: 3px;
        font-size: 11px; font-weight: 600; color: ${C.textMuted}; min-height: 56px; }
      .nav-btn.active { color: ${BRAND.red}; }
      .topbar { position: sticky; top: 0; z-index: 15; background: rgba(244,246,248,0.92); backdrop-filter: blur(8px); border-bottom: 1px solid ${C.border}; }
      .topbar-inner { max-width: 640px; margin: 0 auto; display: flex; align-items: center; gap: 10px; padding: 10px 14px; min-height: 54px; }
      .press:active { transform: scale(0.985); }
      .sheet-backdrop { position: fixed; inset: 0; background: rgba(17,24,39,0.45); z-index: 40; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn .15s ease-out; }
      .sheet { background: ${C.card}; width: 100%; max-width: 640px; border-radius: 16px 16px 0 0; padding: 16px 16px calc(16px + env(safe-area-inset-bottom)); animation: sheetIn .22s cubic-bezier(.2,.9,.3,1); }
      @keyframes sheetIn { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
      .lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .photo-strip { display: flex; gap: 8px; flex-wrap: wrap; }
      .photo-strip img { width: 84px; height: 84px; object-fit: cover; border-radius: 10px; border: 1px solid ${C.border}; }
      .guide p { margin: 0 0 10px; line-height: 1.55; font-size: 15px; }
      .guide ul { margin: 0 0 10px; padding-left: 20px; line-height: 1.55; font-size: 15px; }
      .guide li { margin-bottom: 4px; }
    `}</style>
  );
}
