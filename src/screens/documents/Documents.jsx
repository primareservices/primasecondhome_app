import { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK, shadow } from '../../config/app-config.js';
import { DOC_PICKUPS, DOC_PURPOSES } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest, getPermitExpiry, listRequests, setPermitExpiry, subscribe } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { fmtDate, fmtDay, todayISO } from '../../lib/format.js';
import { compressImage } from '../../lib/photo.js';
import { permitStatus } from '../../domain/permit.js';
import { Banner, Card, Field, IconBox, PageHeader, SectionLabel, Segmented, Sheet, StatusBadge, Tag, inkBtn, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const RING = 2 * Math.PI * 40; // obvod kruhu r=40 v 92px hero prstenci
const RING_COLOR = { success: '#7ED9A6', warning: '#F6B26B', danger: '#FF8A96' };

// Povolenie na pobyt: vínový hero s prstencom odpočtu (posledných 180 dní), pripomienky 90/60/30.
function PermitHero({ stay, t, lang }) {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState('');
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const expiry = useMemo(() => getPermitExpiry(stay.id), [stay, tick]);
  const st = permitStatus(expiry);
  const save = () => { if (date) { setPermitExpiry(stay.id, date); setEditing(false); } };
  if (!st.set || editing) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><IconBox name="FileCheck" tone="brand"/><b style={{ fontSize: 16, letterSpacing: '-0.01em' }}>{t('docs.permit')}</b></div>
        <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45, marginBottom: 14 }}>{t('docs.permitSet')}</div>
        <Field label={t('docs.permitValidUntil')}><input type="date" value={date || expiry || ''} onChange={e => setDate(e.target.value)} style={inputStyle}/></Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {editing && <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setEditing(false)}>{t('common.cancel')}</button>}
          <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={save} disabled={!date && !expiry}><Icon name="Calendar" size={18}/>{t('docs.permitSave')}</button>
        </div>
      </Card>
    );
  }
  const pct = Math.max(0, Math.min(1, st.days / 180));
  const glass = { background: 'rgba(255,255,255,0.16)', color: '#fff' };
  return (
    <>
      <div style={{ background: BRAND.wineGradient, color: '#fff', borderRadius: 28, padding: 20, position: 'relative', overflow: 'hidden', boxShadow: shadow.lg }}>
        <svg width="200" height="200" viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', right: -22, bottom: -30, opacity: 0.08 }}><path d="M50 24 L18 50 H27 V78 H44 V60 H56 V78 H73 V50 H82 Z" fill="#fff"/></svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
              <circle cx="46" cy="46" r="40" stroke="rgba(255,255,255,0.18)" strokeWidth="8" fill="none"/>
              <circle cx="46" cy="46" r="40" stroke={RING_COLOR[st.tone] || RING_COLOR.danger} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - pct)}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <b className="num" style={{ fontSize: 26, lineHeight: 1 }}>{st.expired ? 0 : st.days}</b>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.8 }}>{t('docs.daysUnit')}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.75, textTransform: 'uppercase' }}>{t('docs.permit')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.2 }}>{t('docs.permitValidUntil')} {fmtDate(expiry, lang)}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{st.expired ? t('docs.permitExpired') : t('docs.permitDays', { n: st.days })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.75, flex: 1 }}>{t('docs.permitReminders')}</span>
          {st.reminders.map(r => <Tag key={r.days} icon={r.due ? 'Check' : undefined} style={r.due ? glass : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{t('docs.daysN', { n: r.days })}</Tag>)}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <a href={NETWORK.foreignPoliceUrl} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, flex: 1, minHeight: 46, fontSize: 14, textDecoration: 'none', boxShadow: 'none' }}>{t('docs.bookAppointment')}</a>
          <button type="button" style={{ ...secondaryBtn, flex: 1, minHeight: 46, fontSize: 14, ...glass, boxShadow: 'none' }} onClick={() => { setDate(expiry); setEditing(true); }}>{t('docs.permitChange')}</button>
        </div>
      </div>
      <div className="hint" style={{ margin: '12px 2px 0' }}>{t('docs.permitHint')}</div>
    </>
  );
}

// Fotky dokladov ostávajú len v telefóne (localStorage) — PRIMA ich nevidí.
const WALLET = [['passport', 'docs.wallet.passport'], ['permit', 'docs.wallet.permit'], ['insurance', 'docs.wallet.insurance']];
function Wallet({ stayId, t }) {
  const key = 'psh_wallet_' + stayId;
  const [docs, setDocs] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } });
  const [open, setOpen] = useState(null);
  const target = useRef(null);
  const fileRef = useRef(null);
  const persist = (next) => { setDocs(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch {} };
  const pick = (k) => { target.current = k; if (fileRef.current) fileRef.current.click(); };
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f || !target.current) return;
    try { const dataUrl = await compressImage(f, { maxSide: 1400, quality: 0.8 }); persist({ ...docs, [target.current]: dataUrl }); } catch {}
  };
  const tile = { padding: 0, border: 'none', borderRadius: 20, background: C.card, boxShadow: shadow.sm, color: C.text, aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 };
  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {WALLET.map(([k, tk]) => docs[k] ? (
          <button key={k} type="button" className="press" onClick={() => setOpen(k)} style={tile} aria-label={t(tk)}>
            <img src={docs[k]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
            <span style={{ position: 'absolute', left: 8, right: 8, bottom: 8, background: 'rgba(23,22,26,0.72)', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '4px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(tk)}</span>
          </button>
        ) : (
          <button key={k} type="button" className="press" onClick={() => pick(k)} style={{ ...tile, padding: '14px 10px' }}>
            <IconBox name="Camera" size={40} iconSize={20} radius={14}/>
            <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2, textAlign: 'center' }}>{t(tk)}</span>
          </button>
        ))}
      </div>
      <Sheet open={!!open} title={open ? t('docs.wallet.' + open) : ''} onClose={() => setOpen(null)}>
        {open && docs[open] && <img src={docs[open]} alt="" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 18, display: 'block', background: C.bg }}/>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => { const n = { ...docs }; delete n[open]; persist(n); setOpen(null); }}><Icon name="Trash2" size={16}/>{t('common.remove')}</button>
          <button type="button" style={{ ...inkBtn, flex: 1, boxShadow: 'none' }} onClick={() => { const k = open; setOpen(null); pick(k); }}><Icon name="Camera" size={16}/>{t('common.change')}</button>
        </div>
      </Sheet>
    </>
  );
}

export function Documents() {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(false);
  const [purpose, setPurpose] = useState('renewal');
  const [passport, setPassport] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [pickup, setPickup] = useState('reception');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const docs = useMemo(() => listRequests(stay.id).filter(r => r.kind === 'document'), [stay, tick]);

  const submit = () => {
    setError('');
    if (passport.trim().length < 5) { setError(t('docs.needPassport')); return; }
    const req = createRequest(stay.id, { kind: 'document', doc: 'confirmation', purpose, passport: passport.trim().toUpperCase(), neededBy, pickup, lang });
    setDone(req); setForm(false); setPassport('');
  };
  return (
    <>
      <PageHeader title={t('docs.title')} onBack={() => back('/')}/>
      <PermitHero stay={stay} t={t} lang={lang}/>

      <Card className="rows" style={{ padding: '4px 18px', marginTop: 18 }}>
        <div className="row">
          <IconBox name={stay.registeredAt ? 'ShieldCheck' : 'Hourglass'} tone={stay.registeredAt ? 'success' : 'warning'}/>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{t('docs.registration')}</span>
            <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{stay.registeredAt ? t('docs.registeredOn', { date: fmtDate(stay.registeredAt, lang) }) : t('docs.registrationPending')}</span>
            <span style={{ display: 'flex', marginTop: 7 }}>{stay.registeredAt ? <Tag tone="success" icon="Check">{t('status.resolved')}</Tag> : <Tag tone="warning" icon="Clock">{t('docs.pending')}</Tag>}</span>
          </span>
        </div>
        {docs.map(r => (
          <button key={r.id} type="button" className="row press" onClick={() => navigate('/requests/' + r.id)} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: C.text, padding: '14px 0' }}>
            <IconBox name="FileCheck" tone="info"/>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{t('docs.confirmation')}</span>
              <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{r.ref} · {t('docs.purpose.' + (r.purpose || 'other'))} · {t('docs.requested', { date: fmtDay(r.createdAt, lang, t) })}</span>
              <span style={{ display: 'flex', marginTop: 7 }}><StatusBadge status={r.status}/></span>
            </span>
            <Icon name="ChevronRight" size={20} color={C.textFaint}/>
          </button>
        ))}
      </Card>
      <div className="hint" style={{ margin: '12px 2px 0' }}>{t('docs.registrationInfo')}</div>

      {done && <Banner tone="success" icon="CheckCircle2" style={{ marginTop: 16 }}><b>{t('docs.sentTitle')}</b><div>{t('docs.sentSub', { ref: done.ref })}</div></Banner>}
      {!form ? (
        <button type="button" style={{ ...secondaryBtn, marginTop: 16, minHeight: 54 }} onClick={() => { setDone(null); setForm(true); }}><Icon name="FileCheck" size={20}/>{t('docs.request')}</button>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}><IconBox name="FileCheck" tone="info"/><b style={{ fontSize: 16, letterSpacing: '-0.01em' }}>{t('docs.confirmation')}</b></div>
          <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45, marginBottom: 16 }}>{t('docs.confirmationSub')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label={t('docs.purpose')}><Segmented options={DOC_PURPOSES.map(p => ({ key: p.key, label: t(p.t) }))} value={purpose} onChange={setPurpose}/></Field>
            <Field label={t('docs.passport')}><input value={passport} onChange={e => setPassport(e.target.value)} autoCapitalize="characters" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}/></Field>
            <Field label={t('docs.validUntil')} optional><input type="date" min={todayISO()} value={neededBy} onChange={e => setNeededBy(e.target.value)} style={inputStyle}/></Field>
            <Field label={t('docs.pickup')}><Segmented options={DOC_PICKUPS.map(p => ({ key: p.key, label: t(p.t) }))} value={pickup} onChange={setPickup}/></Field>
            <Banner tone="warning" icon="AlertTriangle">{t('docs.legal')}</Banner>
            {error && <Banner tone="danger" icon="AlertCircle">{error}</Banner>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setForm(false)}>{t('common.cancel')}</button>
              <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={submit}><Icon name="Send" size={18}/>{t('common.send')}</button>
            </div>
          </div>
        </Card>
      )}

      <SectionLabel action={<span style={{ fontSize: 13, fontWeight: 800, color: C.textFaint }}>{t('docs.walletLocal')}</span>}>{t('docs.wallet')}</SectionLabel>
      <Wallet stayId={stay.id} t={t}/>
      <div className="hint" style={{ margin: '12px 2px 0' }}>{t('docs.walletHint')}</div>
    </>
  );
}
