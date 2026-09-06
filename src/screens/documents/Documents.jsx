import { useEffect, useMemo, useState } from 'react';
import { C } from '../../config/theme.js';
import { DOC_PICKUPS, DOC_PURPOSES } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest, listRequests, subscribe } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { fmtDate, fmtDay, todayISO } from '../../lib/format.js';
import { Banner, Card, Field, ListRow, PageHeader, SectionLabel, Segmented, StatusBadge, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

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
