import { useEffect, useMemo, useState } from 'react';
import { C } from '../../config/theme.js';
import { DEMO_MODE } from '../../config/app-config.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { getIdentity, setIdentitySkipped, startIdentity, subscribe, syncNow } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { fmtDateTime } from '../../lib/format.js';
import { Banner, Card, IconBox, PageHeader, Spinner, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

// Check-in krok 2: overenie dokladu (OP/pas + selfie) u poskytovateľa eKYC. Appka len otvorí
// presmerovanie zo servera (identity-start) a po návrate (?done=1) čaká na výsledok z webhooku.
// Dá sa preskočiť („overím na recepcii“) — hosť nesmie ostať zablokovaný.
export const IDENTITY_TONE = { approved: 'success', declined: 'danger', review: 'warning', pending: 'warning' };
export function Identity({ query }) {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const idn = useMemo(() => getIdentity(stay.id), [stay, tick]);
  const status = idn ? idn.status : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const step = query && query.get('step') === '1';
  const fromProvider = query && query.get('done') === '1';
  // po návrate od poskytovateľa príde výsledok webhookom → chvíľu doťahujeme zo servera
  useEffect(() => {
    if (!fromProvider || status === 'approved' || status === 'declined') return undefined;
    let n = 0; syncNow().catch(() => {});
    const id = setInterval(() => { n += 1; syncNow().catch(() => {}); if (n >= 12) clearInterval(id); }, 5000);
    return () => clearInterval(id);
  }, [fromProvider, status]);

  const start = async () => {
    setError(''); setBusy(true);
    try {
      const r = await startIdentity(stay.id, { lang });
      if (!r || r.status === 'unavailable') { setUnavailable(true); setIdentitySkipped(stay.id, true); }
      else if (r.url) window.location.assign(r.url);
    } catch (e) { setError(t(e && e.message === 'offline' ? 'identity.offline' : 'common.error')); }
    setBusy(false);
  };
  const later = () => { setIdentitySkipped(stay.id, true); navigate('/', { replace: true }); };
  const done = () => navigate('/', { replace: true });
  const tone = unavailable ? 'info' : (IDENTITY_TONE[status] || 'info');
  const canStart = !busy && !unavailable && status !== 'approved' && status !== 'review' && !(status === 'pending' && fromProvider);
  return (
    <div className="page fade-in">
      <PageHeader title={t('identity.title')} sub={step ? t('identity.step') : undefined} onBack={step ? undefined : () => back('/')}/>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <IconBox name={status === 'approved' ? 'UserCheck' : 'ScanFace'} tone={tone}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>{t('home.checkinIdentity')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{stay.displayName} · {t('home.room')} {stay.room}</div>
          </div>
        </div>
        {unavailable ? <Banner tone="info" icon="Info">{t('identity.unavailable')}</Banner>
          : status === 'approved' ? <Banner tone="success" icon="CheckCircle2">{t('identity.approved')}{idn.checkedAt ? ' · ' + t('identity.checkedAt', { date: fmtDateTime(idn.checkedAt, lang) }) : ''}</Banner>
          : status === 'declined' ? <Banner tone="danger" icon="AlertTriangle">{t('identity.declined')}</Banner>
          : status === 'review' ? <Banner tone="warning" icon="Hourglass">{t('identity.review')}</Banner>
          : status === 'pending' ? <Banner tone="warning" icon="Hourglass"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ flex: 1 }}>{t('identity.pending')}</span><Spinner/></span></Banner>
          : <div style={{ fontSize: 14, lineHeight: 1.5 }}>{t('identity.intro')}</div>}
        {status !== 'approved' && <div className="hint" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><Icon name="ShieldCheck" size={16} color={C.textFaint} style={{ flexShrink: 0, marginTop: 1 }}/><span>{t('identity.privacy')}</span></div>}
        {DEMO_MODE && status !== 'approved' && !unavailable && <div className="hint">{t('identity.demo')}</div>}
        {error && <Banner tone="danger" icon="AlertCircle">{error}</Banner>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {status === 'approved' || unavailable ? (
            <button type="button" style={primaryBtn} onClick={done}><Icon name="Check" size={18}/>{t('common.continue')}</button>
          ) : (
            <>
              {canStart && <button type="button" style={primaryBtn} onClick={start} disabled={busy}>{busy ? <Spinner/> : <Icon name="ScanFace" size={18}/>}{t('identity.start')}</button>}
              <button type="button" style={secondaryBtn} onClick={later}>{t('identity.later')}</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
