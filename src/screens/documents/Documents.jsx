import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK } from '../../config/app-config.js';
import { DOC_PICKUPS, DOC_PURPOSES } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest, getPermitExpiry, listRequests, setPermitExpiry, subscribe } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { fmtDate, fmtDay, todayISO } from '../../lib/format.js';
import { permitStatus } from '../../domain/permit.js';
import { Banner, Card, Field, KeyValue, ListRow, PageHeader, SectionLabel, Segmented, StatusBadge, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const TONE = { success: [C.successSoft, C.successText], warning: [C.warningSoft, C.warningText], danger: [BRAND.redSoft, BRAND.redText], muted: ['#F1F5F9', '#475569'] };

function PermitCard({ stay, t, lang }) {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState('');
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const expiry = useMemo(() => getPermitExpiry(stay.id), [stay, tick]);
  const st = permitStatus(expiry);
  const [bg, fg] = TONE[st.tone] || TONE.muted;
  const save = () => { if (date) { setPermitExpiry(stay.id, date); setEditing(false); } };
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="FileCheck" size={19}/></span>
        <b style={{ flex: 1, fontSize: 16 }}>{t('docs.permit')}</b>
        {st.set && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: fg, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: fg }}/>{st.expired ? t('docs.permitExpired') : t('docs.permitDays', { n: st.days })}</span>}
      </div>
      {!st.set || editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45 }}>{t('docs.permitSet')}</div>
          <Field label={t('docs.permitValidUntil')}><input type="date" value={date || expiry || ''} onChange={e => setDate(e.target.value)} style={inputStyle}/></Field>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing && <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setEditing(false)}>{t('common.cancel')}</button>}
            <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={save} disabled={!date && !expiry}><Icon name="Calendar" size={18}/>{t('docs.permitSave')}</button>
          </div>
        </div>
      ) : (
        <>
          <KeyValue label={t('docs.permitValidUntil')} value={fmtDate(expiry, lang)}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>{t('docs.permitReminders')}</span>
            {st.reminders.map(r => <span key={r.days} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: r.due ? C.successSoft : '#F1F5F9', color: r.due ? C.successText : '#475569', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '3px 9px' }}><Icon name={r.due ? 'CheckCircle2' : 'Clock'} size={13}/>{t('docs.daysN', { n: r.days })}</span>)}
          </div>
          <Banner tone={st.tone === 'success' ? 'info' : 'warning'} icon="AlertTriangle" style={{ marginTop: 12 }}>{t('docs.permitHint')}</Banner>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <a href={NETWORK.foreignPoliceUrl} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, flex: 1, minHeight: 44, fontSize: 14, textDecoration: 'none' }}><Icon name="ExternalLink" size={15}/>{t('docs.bookAppointment')}</a>
            <button type="button" style={{ ...secondaryBtn, flex: 1, minHeight: 44, fontSize: 14 }} onClick={() => { setDate(expiry); setEditing(true); }}><Icon name="Calendar" size={15}/>{t('docs.permitChange')}</button>
          </div>
        </>
      )}
    </Card>
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
      <PermitCard stay={stay} t={t} lang={lang}/>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: stay.registeredAt ? C.success : C.warning, display: 'flex' }}><Icon name={stay.registeredAt ? 'ShieldCheck' : 'Hourglass'} size={24}/></span>
          <b style={{ fontSize: 16 }}>{t('docs.registration')}</b>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>{stay.registeredAt ? t('docs.registeredOn', { date: fmtDate(stay.registeredAt, lang) }) : t('docs.registrationPending')}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6, lineHeight: 1.45 }}>{t('docs.registrationInfo')}</div>
      </Card>

      <Card>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: C.infoText, display: 'flex' }}><Icon name="FileCheck" size={24}/></span>
          <b style={{ fontSize: 16 }}>{t('docs.confirmation')}</b>
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45, marginBottom: 12 }}>{t('docs.confirmationSub')}</div>
        {done && <Banner tone="success" icon="CheckCircle2" style={{ marginBottom: 12 }}><b>{t('docs.sentTitle')}</b><div>{t('docs.sentSub', { ref: done.ref })}</div></Banner>}
        {!form ? (
          <button type="button" style={primaryBtn} onClick={() => { setDone(null); setForm(true); }}><Icon name="FileText" size={18}/>{t('docs.request')}</button>
        ) : (
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
        )}
      </Card>

      {docs.length > 0 && <>
        <SectionLabel>{t('requests.kind.document')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(r => <ListRow key={r.id} icon="FileCheck" title={t('docs.confirmation')} sub={r.ref + ' · ' + t('docs.requested', { date: fmtDay(r.createdAt, lang, t) })} right={<StatusBadge status={r.status}/>} onClick={() => navigate('/requests/' + r.id)}/>)}
        </div>
      </>}
    </>
  );
}
