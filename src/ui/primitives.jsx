import { useEffect } from 'react';
import { BRAND, C } from '../config/theme.js';
import { monoFamily, shadow } from '../config/app-config.js';
import { useT } from '../i18n/index.js';
import { statusMeta } from '../domain/request-status.js';
import { Icon } from './icons.jsx';

export const inputStyle = {
  width: '100%', padding: '12px 13px', fontSize: 16, minHeight: 46,
  background: C.card, border: '1px solid ' + C.borderStrong, borderRadius: C.radiusSm,
  color: C.text, fontFamily: 'inherit',
};
export const primaryBtn = {
  width: '100%', padding: '13px 16px', borderRadius: C.radiusSm, minHeight: 48,
  background: BRAND.red, color: '#FFFFFF', border: 'none',
  fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: shadow.sm,
};
export const secondaryBtn = {
  ...primaryBtn, background: C.card, color: C.text, border: '1px solid ' + C.borderStrong, boxShadow: 'none', fontWeight: 600,
};
export const ghostBtn = {
  background: 'transparent', border: 'none', color: C.textMuted, fontSize: 14, fontWeight: 600, padding: '10px 12px',
  display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: C.radiusSm, minHeight: 44,
};

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} className={onClick ? 'press' : undefined} style={{
      background: C.card, border: '1px solid ' + C.border, borderRadius: C.radius, padding: 16,
      boxShadow: shadow.sm, ...(onClick ? { cursor: 'pointer' } : null), ...style,
    }}>{children}</div>
  );
}
export function SectionLabel({ children, style, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '18px 2px 10px', ...style }}>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</span>
      {action}
    </div>
  );
}
export function Field({ label, hint, children, style, optional }) {
  const { t } = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}{optional && <span style={{ color: C.textFaint, fontWeight: 500 }}> · {t('common.optional')}</span>}</label>}
      {children}
      {hint && <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ background: C.card, border: '1px dashed ' + C.borderStrong, borderRadius: C.radius, padding: '32px 20px', textAlign: 'center', color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint }}><Icon name={icon} size={22}/></div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>{subtitle}</div>}
    </div>
  );
}
export function Chip({ active, onClick, children, icon }) {
  return (
    <button type="button" onClick={onClick} style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', minHeight: 40, borderRadius: 999,
      border: '1px solid ' + (active ? BRAND.red : C.borderStrong), background: active ? BRAND.redSoft : C.card,
      color: active ? BRAND.redText : C.text, fontSize: 14, fontWeight: 600,
    }}>{icon && <Icon name={icon} size={15}/>}{children}</button>
  );
}
export function ListRow({ icon, title, sub, right, onClick, tone, badge }) {
  const bg = tone === 'danger' ? BRAND.redSoft : tone === 'success' ? C.successSoft : tone === 'info' ? C.infoSoft : C.cardAlt;
  const fg = tone === 'danger' ? BRAND.red : tone === 'success' ? C.successText : tone === 'info' ? C.infoText : C.textMuted;
  return (
    <button type="button" onClick={onClick} className="press" style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 60,
      background: C.card, border: '1px solid ' + C.border, borderRadius: C.radius, color: C.text, boxShadow: shadow.sm,
    }}>
      {icon && <span style={{ width: 38, height: 38, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={19}/></span>}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}
      </span>
      {badge != null && badge !== 0 && <span style={{ background: BRAND.red, color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '2px 8px', fontFamily: monoFamily }}>{badge}</span>}
      {right}
      {onClick && <Icon name="ChevronRight" size={18} color={C.textFaint}/>}
    </button>
  );
}
const TONES = {
  muted:   { bg: '#F1F5F9', fg: '#475569' },
  accent:  { bg: C.accentSoft, fg: C.accentText },
  info:    { bg: C.infoSoft, fg: C.infoText },
  warning: { bg: C.warningSoft, fg: C.warningText },
  danger:  { bg: BRAND.redSoft, fg: BRAND.redText },
  success: { bg: C.successSoft, fg: C.successText },
};
export function StatusBadge({ status }) {
  const { t } = useT();
  const m = statusMeta(status);
  const tone = TONES[m.tone] || TONES.muted;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: tone.bg, color: tone.fg, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone.fg }}/>{t(m.t)}
  </span>;
}
export function Banner({ tone = 'info', icon, children, style }) {
  const c = tone === 'warning' ? { bg: C.warningSoft, bd: C.warningBorder, fg: C.warningText }
    : tone === 'success' ? { bg: C.successSoft, bd: C.successBorder, fg: C.successText }
    : tone === 'danger' ? { bg: BRAND.redSoft, bd: '#FBCBD2', fg: BRAND.redText }
    : { bg: C.infoSoft, bd: C.infoBorder, fg: C.infoText };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: c.bg, border: '1px solid ' + c.bd, color: C.text, borderRadius: C.radius, padding: '12px 14px', fontSize: 14, lineHeight: 1.45, ...style }}>
      {icon && <span style={{ color: c.fg, flexShrink: 0, marginTop: 1 }}><Icon name={icon} size={18}/></span>}
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
export function PageHeader({ title, sub, onBack, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 14px' }}>
      {onBack && <button type="button" onClick={onBack} aria-label="back" style={{ ...ghostBtn, padding: 8, marginLeft: -8, color: C.text }}><Icon name="ChevronLeft" size={24}/></button>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</h1>
        {sub && <div style={{ fontSize: 14, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
export function Spinner({ size = 20 }) {
  return <span style={{ display: 'inline-flex', color: C.textMuted }}><Icon name="Loader2" size={size} className="animate-spin"/></span>;
}
export function Toggle({ checked, onChange, label, sub }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: '10px 0', textAlign: 'left', color: C.text }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{ width: 46, height: 28, borderRadius: 999, background: checked ? C.success : C.borderStrong, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: shadow.sm, transition: 'left .15s' }}/>
      </span>
    </button>
  );
}
export function Stars({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{label}</span>
      <span style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={String(n)} style={{ background: 'none', border: 'none', padding: 4, color: n <= value ? C.warning : C.borderStrong, display: 'flex' }}>
            <Icon name="Star" size={26} fill={n <= value ? C.warning : 'none'}/>
          </button>
        ))}
      </span>
    </div>
  );
}
export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(o => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)} style={{
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '11px 13px', minHeight: 46, borderRadius: C.radiusSm,
          border: '1px solid ' + (value === o.key ? BRAND.red : C.borderStrong), background: value === o.key ? BRAND.redSoft : C.card, color: C.text, fontSize: 15, fontWeight: 600,
        }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (value === o.key ? BRAND.red : C.borderStrong), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {value === o.key && <span style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.red }}/>}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function BigAction({ icon, title, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', minHeight: 76, borderRadius: C.radius,
      background: BRAND.red, color: '#fff', border: 'none', boxShadow: '0 6px 18px ' + BRAND.redGlow, textAlign: 'left',
    }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={24}/></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, opacity: 0.9, marginTop: 2 }}>{sub}</span>}
      </span>
      <Icon name="ChevronRight" size={20}/>
    </button>
  );
}
export function Tile({ icon, title, sub, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} className="press" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14, minHeight: 104, borderRadius: C.radius, textAlign: 'left',
      background: C.card, border: '1px solid ' + C.border, color: C.text, boxShadow: shadow.sm, position: 'relative',
    }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: BRAND.redSoft, color: BRAND.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={20}/></span>
      <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{title}</span>
      {sub && <span style={{ display: 'block', fontSize: 12.5, color: C.textMuted, lineHeight: 1.35 }}>{sub}</span>}
      {badge ? <span style={{ position: 'absolute', top: 10, right: 10, background: BRAND.red, color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '2px 8px', fontFamily: monoFamily }}>{badge}</span> : null}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <b style={{ flex: 1, fontSize: 17 }}>{title}</b>
          <button type="button" onClick={onClose} aria-label="close" style={{ ...ghostBtn, padding: 6 }}><Icon name="X" size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function KeyValue({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid ' + C.border, fontSize: 15 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <b style={{ textAlign: 'right', fontFamily: mono ? monoFamily : undefined, fontWeight: mono ? 600 : 700 }}>{value}</b>
    </div>
  );
}
