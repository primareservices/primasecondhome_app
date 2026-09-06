import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { listAnnouncements, listRequests, subscribe } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { fmtDate } from '../../lib/format.js';
import { nextCleaningDate } from '../../domain/cleaning.js';
import { isOpen } from '../../domain/request-status.js';
import { roomLabel } from '../../domain/room-codes.js';
import { pickText } from '../../content/index.js';
import { BigAction, Card, ListRow, SectionLabel, Tile, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function AnnouncementRow({ a, lang, onClick }) {
  const tx = a.texts[lang] || a.texts.en || Object.values(a.texts)[0];
  const icon = a.severity === 'urgent' ? 'Siren' : a.severity === 'warning' ? 'AlertTriangle' : 'Megaphone';
  const tone = a.severity === 'urgent' ? 'danger' : a.severity === 'warning' ? 'info' : undefined;
  return <ListRow icon={icon} tone={tone} title={tx.title} sub={pickText(tx.body, lang)} onClick={onClick} right={a.unread ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: BRAND.red, flexShrink: 0 }}/> : null}/>;
}

export function Home() {
  const { t, lang } = useT();
  const { stay, property, publicMode } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const anns = useMemo(() => property ? listAnnouncements(property.id) : [], [property, tick]);
  const reqs = useMemo(() => stay ? listRequests(stay.id) : [], [stay, tick]);
  const open = reqs.filter(isOpen);
  const cleaning = nextCleaningDate();

  return (
    <>
      {stay ? (
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: C.navy, color: '#fff', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{t('home.hello', { name: stay.displayName })}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{property.name}</span>
              <span style={{ fontSize: 13, opacity: 0.75 }}>{t('home.room')}</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: monoFamily, letterSpacing: '-0.02em' }}>{roomLabel(stay.room)}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', padding: '12px 16px', fontSize: 13 }}>
            <div><div style={{ color: C.textMuted }}>{t('home.checkIn')}</div><b>{fmtDate(stay.checkIn, lang)}</b></div>
            <div><div style={{ color: C.textMuted }}>{t('home.checkOut')}</div><b>{fmtDate(stay.checkOut, lang)}</b></div>
            <div><div style={{ color: C.textMuted }}>{t('home.company')}</div><b>{stay.company}</b></div>
            <div><div style={{ color: C.textMuted }}>{t('home.nextCleaning')}</div><b>{fmtDate(cleaning.toISOString(), lang)}</b></div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: C.infoText, display: 'flex' }}><Icon name="Info" size={22}/></span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{t('home.publicMode')} · {property ? property.name : ''}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{t('home.publicModeSub')}</div>
            </div>
          </div>
          <button type="button" style={primaryBtn} onClick={() => navigate('/welcome?step=code')}><Icon name="KeyRound" size={18}/>{t('home.signInCta')}</button>
        </Card>
      )}

      {stay && <BigAction icon="Wrench" title={t('home.reportProblem')} sub={t('home.reportSub')} onClick={() => navigate('/report')}/>}

      <div className="grid-2" style={{ marginTop: 12 }}>
        {stay ? (
          <>
            <Tile icon="WashingMachine" title={t('home.services')} sub={t('home.servicesSub')} onClick={() => navigate('/services')}/>
            <Tile icon="Headset" title={t('home.askReception')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
            <Tile icon="FileCheck" title={t('home.documents')} sub={t('home.documentsSub')} onClick={() => navigate('/documents')}/>
            <Tile icon="BookOpen" title={t('home.guides')} sub={t('home.guidesSub')} onClick={() => navigate('/guides')}/>
          </>
        ) : (
          <>
            <Tile icon="Building2" title={t('info.title')} sub={property ? property.street : ''} onClick={() => navigate('/info')}/>
            <Tile icon="ShieldCheck" title={t('rules.title')} sub={t('rules.readFull')} onClick={() => navigate('/info/rules')}/>
            <Tile icon="Headset" title={t('contacts.title')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
            <Tile icon="BookOpen" title={t('home.guides')} sub={t('home.guidesSub')} onClick={() => navigate('/guides')}/>
          </>
        )}
      </div>

      {stay && open.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ListRow icon="ClipboardList" tone="info" title={t('home.openRequests')} sub={open.map(r => r.ref).join(' · ')} badge={open.length} onClick={() => navigate('/requests')}/>
        </div>
      )}

      <SectionLabel action={anns.length > 2 && <button type="button" onClick={() => navigate('/announcements')} style={{ background: 'none', border: 'none', color: C.infoText, fontSize: 13, fontWeight: 700 }}>{t('common.all')}</button>}>
        {t('home.announcements')}
      </SectionLabel>
      {anns.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {anns.slice(0, 3).map(a => <AnnouncementRow key={a.id} a={a} lang={lang} onClick={() => navigate('/announcements')}/>)}
        </div>
      ) : <div style={{ fontSize: 14, color: C.textMuted, padding: '4px 2px' }}>{t('home.noAnnouncements')}</div>}
      {!publicMode && null}
    </>
  );
}
