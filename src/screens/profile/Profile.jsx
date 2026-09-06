import { useState } from 'react';
import { C } from '../../config/theme.js';
import { APP_VERSION, DEMO_MODE } from '../../config/app-config.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { getNotificationsPref, setNotificationsPref, signOut } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { fmtDate } from '../../lib/format.js';
import { roomLabel } from '../../domain/room-codes.js';
import { LangPicker } from '../../ui/LangPicker.jsx';
import { Banner, Card, KeyValue, ListRow, PageHeader, SectionLabel, Sheet, Toggle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function Profile() {
  const { t, lang, setLang } = useT();
  const { stay, property } = useApp();
  const [notif, setNotif] = useState(() => getNotificationsPref());
  const [confirm, setConfirm] = useState(false);
  const standalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  return (
    <>
      <PageHeader title={t('profile.title')}/>
      {stay ? (
        <Card>
          <SectionLabel style={{ margin: '0 0 8px' }}>{t('profile.stay')}</SectionLabel>
          <KeyValue label={t('home.building')} value={property.name}/>
          <KeyValue label={t('home.room')} value={roomLabel(stay.room)} mono/>
          <KeyValue label={t('home.checkIn')} value={fmtDate(stay.checkIn, lang)}/>
          <KeyValue label={t('home.checkOut')} value={fmtDate(stay.checkOut, lang)}/>
          <KeyValue label={t('home.company')} value={stay.company}/>
        </Card>
      ) : (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t('home.publicMode')}{property ? ' · ' + property.name : ''}</div>
          <button type="button" style={primaryBtn} onClick={() => navigate('/welcome?step=code')}><Icon name="KeyRound" size={18}/>{t('home.signInCta')}</button>
          <button type="button" style={secondaryBtn} onClick={() => navigate('/welcome?step=public')}><Icon name="Building2" size={18}/>{t('info.chooseBuilding')}</button>
        </Card>
      )}
      <SectionLabel>{t('profile.language')}</SectionLabel>
      <LangPicker value={lang} onChange={setLang} compact/>

      <SectionLabel>{t('profile.notifications')}</SectionLabel>
      <Card style={{ padding: '4px 16px' }}><Toggle checked={notif} onChange={v => { setNotif(v); setNotificationsPref(v); }} label={t('profile.notifications')} sub={t('profile.notificationsSub')}/></Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <ListRow icon="ShieldCheck" title={t('profile.rulesAgain')} onClick={() => navigate('/info/rules')}/>
        {stay && <ListRow icon="Star" title={t('profile.feedback')} sub={t('feedback.sub')} onClick={() => navigate('/feedback')}/>}
      </div>
      {!standalone && <Banner tone="info" icon="Smartphone" style={{ marginTop: 12 }}><b>{t('profile.install')}</b><div>{t('profile.installHint')}</div></Banner>}

      <SectionLabel>{t('profile.privacy')}</SectionLabel>
      <Card><div style={{ fontSize: 14, lineHeight: 1.5, color: C.text }}>{t('profile.privacyText')}</div></Card>
      {DEMO_MODE && <Banner tone="warning" icon="AlertTriangle" style={{ marginTop: 12 }}>{t('profile.demo')}</Banner>}
      <div style={{ fontSize: 12, color: C.textFaint, textAlign: 'center', margin: '18px 0 10px' }}>PRIMA SECOND HOME · {t('profile.version')} {APP_VERSION}</div>
      {stay && <button type="button" style={{ ...secondaryBtn, color: C.textMuted }} onClick={() => setConfirm(true)}><Icon name="LogOut" size={16}/>{t('profile.signOut')}</button>}
      <Sheet open={confirm} title={t('profile.signOutConfirm')} onClose={() => setConfirm(false)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setConfirm(false)}>{t('common.no')}</button>
          <button type="button" style={{ ...primaryBtn, flex: 1 }} onClick={() => { signOut(); setConfirm(false); navigate('/welcome?step=code', { replace: true }); }}>{t('common.yes')}</button>
        </div>
      </Sheet>
    </>
  );
}
