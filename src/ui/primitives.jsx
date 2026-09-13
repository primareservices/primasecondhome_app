import { useEffect } from 'react';
import { BRAND, C } from '../config/theme.js';
import { monoFamily, shadow } from '../config/app-config.js';
import { useT } from '../i18n/index.js';
import { statusMeta } from '../domain/request-status.js';
import { Icon } from './icons.jsx';
import { RoofAccent } from './PrimaLogo.jsx';

// Komponenty podľa PRIMA Design Manual 2026 v modernom prevedení: Poppins, PRIMA červená ako
// jediná akcia, strieška ako brandový prvok. Verzálky len na drobné popisky — nadpisy, tlačidlá
// a štítky sú vo vetách, tlačidlá sú zaoblené bloky (rádius 16), tiene sú sotva viditeľné,
// vstupy sú vyplnené krémom bez rámika. Biele karty na krémovom pozadí, žiadne gradienty.
export const inputStyle = {
  width: '100%', padding: '14px 16px', fontSize: 16, minHeight: 54,
  background: C.cardAlt, border: 'none', borderRadius: C.radiusSm,
  color: C.text, fontFamily: 'inherit',
};
export const primaryBtn = {
  width: '100%', padding: '0 20px', borderRadius: 16, minHeight: 54,
  background: BRAND.red, color: '#FFFFFF', border: 'none',
  fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  boxShadow: '0 8px 20px ' + BRAND.redGlow,
};
export const secondaryBtn = {
  ...primaryBtn, background: C.cardAlt, color: C.text, boxShadow: 'none', fontSize: 15, minHeight: 52,
};
export const ghostBtn = {
  background: 'transparent', border: 'none', color: C.textMuted, fontSize: 14, fontWeight: 600, padding: '10px 12px',
  display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 14, minHeight: 44,
};
export const inkBtn = { ...primaryBtn, background: C.navy, boxShadow: '0 8px 20px rgba(51,51,51,0.2)' };
export const iconBtn = {
  width: 44, height: 44, borderRadius: 22, background: C.card, border: 'none', boxShadow: shadow.sm,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.text, flexShrink: 0,
};

export function Card({ children, style, onClick, className }) {
  return (
    <div onClick={onClick} className={[onClick ? 'press' : '', className || ''].join(' ').trim() || undefined} style={{
      background: C.card, borderRadius: C.radius, padding: 18, boxShadow: shadow.sm,
      ...(onClick ? { cursor: 'pointer' } : null), ...style,
    }}>{children}</div>
  );
}
// Nadpis sekcie: Poppins Bold vo vetách, voliteľná akcia vpravo („Všetky").
export function SectionLabel({ children, style, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '24px 2px 10px', ...style }}>
      <span style={{ flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: C.text }}>{children}</span>
      {action}
    </div>
  );
}
export function Field({ label, hint, children, style, optional }) {
  const { t } = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {label && <label className="label">{label}{optional && <span style={{ color: C.textFaint }}> · {t('common.optional')}</span>}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ background: C.card, borderRadius: C.radius, padding: '32px 20px', textAlign: 'center', color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: shadow.sm }}>
      <div style={{ width: 52, height: 52, borderRadius: 18, background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint }}><Icon name={icon} size={24}/></div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>{subtitle}</div>}
    </div>
  );
}
export function Chip({ active, onClick, children, icon }) {
  return (
    <button type="button" onClick={onClick} style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40, borderRadius: 999, border: 'none',
      background: active ? BRAND.red : C.card, color: active ? '#fff' : C.text, fontSize: 14, fontWeight: 600,
      boxShadow: active ? '0 6px 16px ' + BRAND.redGlow : shadow.sm, whiteSpace: 'nowrap',
    }}>{icon && <Icon name={icon} size={15}/>}{children}</button>
  );
}
const ICON_TONES = {
  default: { bg: C.cardAlt, fg: C.textMuted },
  danger: { bg: BRAND.red, fg: '#fff' },
  success: { bg: C.successSoft, fg: C.successText },
  info: { bg: C.infoSoft, fg: C.infoText },
  warning: { bg: C.warningSoft, fg: C.warningText },
  brand: { bg: BRAND.redSoft, fg: BRAND.red },
  ink: { bg: C.navy, fg: '#fff' },
};
export function IconBox({ name, tone = 'default', size = 46, iconSize = 22, radius = 16, style }) {
  const t = ICON_TONES[tone] || ICON_TONES.default;
  return <span style={{ width: size, height: size, borderRadius: radius, background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style }}><Icon name={name} size={iconSize}/></span>;
}
export function ListRow({ icon, title, sub, meta, right, onClick, tone, badge, flat }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: flat ? '14px 0' : '14px 16px', minHeight: 64,
      background: flat ? 'transparent' : C.card, border: 'none', borderRadius: flat ? 0 : C.radius, color: C.text, boxShadow: flat ? 'none' : shadow.sm,
      borderTop: flat ? '1px solid ' + C.border : 'none',
    }}>
      {icon && <IconBox name={icon} tone={tone || 'default'}/>}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{sub}</span>}
        {meta && <span style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>{meta}</span>}
      </span>
      {badge != null && badge !== 0 && <span style={{ background: BRAND.red, color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 999, padding: '3px 9px' }}>{badge}</span>}
      {right}
      {onClick && <Icon name="ChevronRight" size={20} color={C.textFaint}/>}
    </button>
  );
}
// Štítok: mäkká pilulka vo vetách; „highlighter" z manuálu = ružový podklad + červený text (danger).
const TONES = {
  muted:   { bg: C.cardAlt, fg: C.textMuted },
  accent:  { bg: C.accentSoft, fg: C.accentText },
  info:    { bg: C.infoSoft, fg: C.infoText },
  warning: { bg: C.warningSoft, fg: C.warningText },
  danger:  { bg: BRAND.redSoft, fg: BRAND.redDark },
  success: { bg: C.successSoft, fg: C.successText },
  ink:     { bg: C.navy, fg: '#fff' },
  red:     { bg: BRAND.red, fg: '#fff' },
};
export function Tag({ tone = 'muted', icon, children, style, wrap }) {
  const t = TONES[tone] || TONES.muted;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 28, padding: wrap ? '4px 11px' : '0 11px', borderRadius: 999, background: t.bg, color: t.fg, fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: wrap ? 'normal' : 'nowrap', maxWidth: '100%', ...style }}>{icon && <Icon name={icon} size={14} style={{ flexShrink: 0 }}/>}<span>{children}</span></span>;
}
export function StatusBadge({ status }) {
  const { t } = useT();
  const m = statusMeta(status);
  return <Tag tone={m.tone}>{t(m.t)}</Tag>;
}
export function Banner({ tone = 'info', icon, children, style }) {
  const c = tone === 'warning' ? { bg: C.warningSoft, fg: C.warningText }
    : tone === 'success' ? { bg: C.successSoft, fg: C.successText }
    : tone === 'danger' ? { bg: BRAND.redSoft, fg: BRAND.redDark }
    : { bg: C.infoSoft, fg: C.infoText };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: c.bg, color: C.text, borderRadius: 16, padding: '12px 14px', fontSize: 14, lineHeight: 1.45, ...style }}>
      {icon && <span style={{ color: c.fg, flexShrink: 0, marginTop: 1 }}><Icon name={icon} size={18}/></span>}
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
    </div>
  );
}
// Hlavička stránky: malá strieška z manuálu nad nadpisom, nadpis Poppins Bold vo vetách.
export function PageHeader({ title, sub, onBack, action, roof = true }) {
  return (
    <div style={{ margin: '4px 0 18px' }}>
      {(onBack || action) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {onBack && <button type="button" onClick={onBack} aria-label="back" style={iconBtn}><Icon name="ChevronLeft" size={22}/></button>}
          <span style={{ flex: 1 }}/>
          {action}
        </div>
      )}
      {roof && <RoofAccent height={12} style={{ marginBottom: 8, marginLeft: 1 }}/>}
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, color: C.text }}>{title}</h1>
      {sub && <div style={{ fontSize: 15, color: C.textMuted, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}
export function Spinner({ size = 20 }) {
  return <span style={{ display: 'inline-flex', color: C.textMuted }}><Icon name="Loader2" size={size} className="animate-spin"/></span>;
}
export function Toggle({ checked, onChange, label, sub }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '12px 0', textAlign: 'left', color: C.text }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{sub}</span>}
      </span>
      <span style={{ width: 50, height: 30, borderRadius: 999, background: checked ? BRAND.red : '#DAD4C8', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(51,51,51,0.2)', transition: 'left .15s' }}/>
      </span>
    </button>
  );
}
export function Stars({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{label}</span>
      <span style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={String(n)} style={{ background: 'none', border: 'none', padding: 4, color: n <= value ? C.warning : '#DAD4C8', display: 'flex' }}>
            <Icon name="Star" size={26} fill={n <= value ? C.warning : 'none'}/>
          </button>
        ))}
      </span>
    </div>
  );
}
export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => {
        const on = value === o.key;
        return (
          <button key={o.key} type="button" onClick={() => onChange(o.key)} className={'opt' + (on ? ' on' : '')} style={{ minHeight: 54 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', boxShadow: 'inset 0 0 0 2px ' + (on ? BRAND.red : '#D0C9BC'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.red }}/>}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
export function BigAction({ icon, title, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{ ...primaryBtn, minHeight: sub ? 68 : 56, justifyContent: 'flex-start', textAlign: 'left', padding: '0 20px 0 18px', borderRadius: 22 }}>
      <span style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={22}/></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700 }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, opacity: 0.9, fontWeight: 500, marginTop: 1 }}>{sub}</span>}
      </span>
      <Icon name="ChevronRight" size={20}/>
    </button>
  );
}
// Rýchla akcia (4 v rade): biela dlaždica s červenou ikonou + názov pod ňou.
export function QuickAction({ icon, title, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{ background: 'none', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: C.text }}>
      <span style={{ position: 'relative', width: 62, height: 62, borderRadius: 20, background: C.card, boxShadow: shadow.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.red }}>
        <Icon name={icon} size={24}/>
        {badge ? <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: BRAND.red, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span> : null}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>{title}</span>
    </button>
  );
}
export function Tile({ icon, title, sub, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 16, minHeight: 116, borderRadius: C.radius, textAlign: 'left',
      background: C.card, border: 'none', color: C.text, boxShadow: shadow.sm, position: 'relative',
    }}>
      <IconBox name={icon} tone="brand" size={40} iconSize={20} radius={14}/>
      <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{title}</span>
      {sub && <span style={{ display: 'block', fontSize: 12.5, color: C.textMuted, lineHeight: 1.35 }}>{sub}</span>}
      {badge ? <span style={{ position: 'absolute', top: 12, right: 12, background: BRAND.red, color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 999, padding: '2px 8px' }}>{badge}</span> : null}
    </button>
  );
}
export function Sheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#DAD4C8', margin: '-4px auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <b style={{ flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</b>
          <button type="button" onClick={onClose} aria-label="close" style={{ ...iconBtn, width: 36, height: 36, boxShadow: 'none', background: C.cardAlt }}><Icon name="X" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function KeyValue({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 15 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <b className={mono ? 'num' : undefined} style={{ textAlign: 'right', fontFamily: mono ? monoFamily : undefined, fontWeight: 600 }}>{value}</b>
    </div>
  );
}
