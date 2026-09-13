import { BRAND, C } from '../config/theme.js';
import { fontFamily } from '../config/app-config.js';

export function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; background: ${C.bg}; color: ${C.text}; font-family: ${fontFamily}; -webkit-font-smoothing: antialiased; }
      button { font-family: inherit; cursor: pointer; }
      input, textarea, select { font-family: inherit; }
      input:focus, textarea:focus, select:focus, button:focus-visible { outline: none; box-shadow: ${C.focusRing}; }
      textarea { resize: vertical; }
      a { color: ${BRAND.redDark}; }
      .page { max-width: 640px; margin: 0 auto; padding: 8px 20px calc(96px + env(safe-area-inset-bottom)); }
      .page-nonav { padding-bottom: 32px; }
      .fade-in { animation: fadeIn .26s cubic-bezier(.2,.8,.2,1); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg) } }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .grid-cats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      @media (min-width: 480px) { .grid-cats { grid-template-columns: repeat(3, 1fr); } }
      .quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .chips { display: flex; gap: 8px; overflow-x: auto; padding: 2px 0 6px; scrollbar-width: none; }
      .chips::-webkit-scrollbar { display: none; }
      .press:active { transform: scale(0.985); }
      .upper { text-transform: uppercase; letter-spacing: 0.03em; }
      .topbar { position: sticky; top: 0; z-index: 15; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); }
      .topbar-inner { max-width: 640px; margin: 0 auto; display: flex; align-items: center; gap: 10px; padding: 12px 20px 6px; min-height: 60px; }
      .bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; padding: 0 0 env(safe-area-inset-bottom); background: rgba(255,255,255,0.96); backdrop-filter: blur(14px); border-top: 1px solid ${C.border}; }
      .bottom-nav-inner { max-width: 640px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 6px 12px; height: 64px; }
      .nav-btn { background: none; border: none; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${C.textFaint}; min-height: 52px; transition: color .15s; }
      .nav-btn.active { color: ${BRAND.red}; }
      .sheet-backdrop { position: fixed; inset: 0; background: rgba(51,51,51,0.45); z-index: 40; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn .15s ease-out; }
      .sheet { background: ${C.card}; width: 100%; max-width: 640px; border-radius: 24px 24px 0 0; padding: 18px 20px calc(20px + env(safe-area-inset-bottom)); box-shadow: 0 -1px 0 ${C.border}; animation: sheetIn .24s cubic-bezier(.2,.9,.3,1); }
      @keyframes sheetIn { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
      .lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .photo-strip { display: flex; gap: 10px; flex-wrap: wrap; }
      .photo-strip img { width: 84px; height: 84px; object-fit: cover; border-radius: 14px; }
      .guide p { margin: 0 0 10px; line-height: 1.55; font-size: 15px; }
      .guide ul { margin: 0 0 10px; padding-left: 20px; line-height: 1.55; font-size: 15px; }
      .guide li { margin-bottom: 4px; }
      .rows > * + * { border-top: 1px solid ${C.border}; }
      .row { display: flex; align-items: center; gap: 14px; padding: 14px 0; min-height: 64px; }
      .bleed { margin-left: -20px; margin-right: -20px; }
      .pill-day { width: 56px; height: 74px; border-radius: 18px; background: ${C.card}; box-shadow: inset 0 0 0 1px ${C.border}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; flex-shrink: 0; border: none; padding: 0; color: ${C.text}; }
      .pill-day span { font-size: 10.5px; font-weight: 700; color: ${C.textFaint}; letter-spacing: 0.06em; text-transform: uppercase; }
      .pill-day b { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
      .pill-day.on { background: ${BRAND.red}; box-shadow: none; }
      .pill-day.on span { color: rgba(255,255,255,0.8); } .pill-day.on b { color: #fff; }
      .m { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; background: ${C.card}; box-shadow: inset 0 0 0 1.5px rgba(51,51,51,0.1); color: ${C.text}; border: none; padding: 0; }
      .m.taken { color: #B5B0A8; box-shadow: none; cursor: default; }
      .m.mine { background: ${C.card}; color: ${C.infoText}; box-shadow: inset 0 0 0 1.5px ${C.infoText}; cursor: default; }
      .m.sel { background: ${BRAND.red}; color: #fff; box-shadow: none; }
      .m.past { opacity: 0.4; cursor: default; }
      .step { display: flex; gap: 14px; align-items: flex-start; }
      .step .n { width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px ${BRAND.red}; color: ${BRAND.red}; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .opt { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: ${C.card}; box-shadow: inset 0 0 0 1px ${C.border}; font-size: 15px; font-weight: 600; border: none; color: ${C.text}; text-align: left; }
      .opt.on { box-shadow: inset 0 0 0 2px ${BRAND.red}; }
      .label { font-size: 13px; font-weight: 600; color: ${C.textMuted}; }
      .hint { font-size: 13px; color: ${C.textMuted}; line-height: 1.5; }
      .note { background: ${C.card}; border-radius: 18px; padding: 14px 16px; font-size: 13.5px; line-height: 1.5; color: ${BRAND.redDark}; font-weight: 500; box-shadow: inset 0 0 0 1px #F5C2BF; }
      .hatch { background-color: #F4F4F4; background-image: repeating-linear-gradient(135deg, rgba(51,51,51,0.1) 0 3px, transparent 3px 8px); }
      .num { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
    `}</style>
  );
}
