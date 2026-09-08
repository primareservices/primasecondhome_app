import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { getPermitExpiry, listAnnouncements, listBookings, listRequests, subscribe } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { fmtDate } from '../../lib/format.js';
import { nextCleaningDate } from '../../domain/cleaning.js';
import { isOpen } from '../../domain/request-status.js';
import { roomLabel } from '../../domain/room-codes.js';
import { slotLabel, upcomingBooking } from '../../domain/laundry.js';
import { permitStatus } from '../../domain/permit.js';
import { pickText } from '../../content/index.js';
import { BigAction, Card, ListRow, SectionLabel, Tile, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function AnnouncementRow({ a, lang, onClick }) {
  const tx = a.texts[lang] || a.texts.en || Object.values(a.texts)[0];
  const icon = a.severity === 'urgent' ? 'Siren' : a.severity === 'warning' ? 'AlertTriangle' : 'Megaphone';
  const tone = a.severity === 'urgent' ? 'danger' : a.severity === 'warning' ? 'info' : undefined;
  return <ListRow icon={icon} tone={tone} title={tx.title} sub={pickText(tx.body, lang)} onClick={onClick} right={a.unread ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: BRAND.red, flexShrink: 0 }}/> : null}/>;
}

function TodayRow({ icon, tone, title, sub, onClick, last }) {
  const bg = tone === 'warning' ? C.warningSoft : tone === 'danger' ? BRAND.redSoft : tone === 'success' ? C.successSoft : C.infoSoft;
  const fg = tone === 'warning' ? C.warningText : tone === 'danger' ? BRAND.redText : tone === 'success' ? C.successText : C.infoText;
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', background: 'none', border: 'none', borderBottom: last ? 'none' : '1px solid ' + C.border, color: C.text }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={19}/></span>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}</span>
      <Icon name="ChevronRight" size={18} color={C.textFaint}/>
    </button>
  );
}

export function Home() {
  const { t, lang } = useT();
  const { stay, property, pack } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const anns = useMemo(() => property ? listAnnouncements(property.id) : [], [property, tick]);
  const reqs = useMemo(() => stay ? listRequests(stay.id) : [], [stay, tick]);
  const booking = useMemo(() => stay && property.laundry === 'booking' ? upcomingBooking(listBookings(stay.id)) : null, [stay, property, tick]);
  const permit = useMemo(() => stay ? permitStatus(getPermitExpiry(stay.id)) : null, [stay, tick]);
  const open = reqs.filter(isOpen);
  const cleaning = nextCleaningDate();
  const bookingIsToday = booking && booking.day === new Date().toISOString().slice(0, 10);

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

      {stay && (booking || permit) && (
        <Card style={{ padding: '6px 16px', marginBottom: 12 }}>
          {booking && <TodayRow icon="WashingMachine" tone="info" title={t('home.laundryBooking', { slot: (bookingIsToday ? t('common.today') : fmtDate(booking.day, lang)) + ' ' + slotLabel(booking.start, booking.len || 2), n: booking.machine })} sub={t('laundry.fee', { price: (pack && pack.facts && pack.facts.laundry && pack.facts.laundry.price) || '2,30 €' })} onClick={() => navigate('/laundry')} last={!permit}/>}
          {permit && <TodayRow icon="FileCheck" tone={permit.set ? permit.tone : 'info'} title={!permit.set ? t('home.permitSet') : permit.expired ? t('home.permitExpired') : t('home.permitDays', { n: permit.days })} sub={t('docs.permitHint')} onClick={() => navigate('/documents')} last/>}
        </Card>
      )}

      {stay && <BigAction icon="Wrench" title={t('home.reportProblem')} sub={t('home.reportSub')} onClick={() => navigate('/report')}/>}

      <div className="grid-2" style={{ marginTop: 12 }}>
        {stay ? (
          <>
            <Tile icon="WashingMachine" title={t('home.services')} sub={t('home.servicesSub')} onClick={() => navigate('/services')}/>
            <Tile icon="Headset" title={t('home.askReception')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
            <Tile icon="FileCheck" title={t('home.documents')} sub={t('home.documentsSub')} onClick={() => navigate('/documents')}/>
            {pack ? <Tile icon="MapPin" title={t('home.around')} sub={t('home.aroundSub')} onClick={() => navigate('/around')}/> : <Tile icon="BookOpen" title={t('home.guides')} sub={t('home.guidesSub')} onClick={() => navigate('/guides')}/>}
          </>
        ) : (
          <>
            <Tile icon="Building2" title={t('info.title')} sub={property ? property.street : ''} onClick={() => navigate('/info')}/>
            <Tile icon="ShieldCheck" title={t('rules.title')} sub={t('rules.readFull')} onClick={() => navigate('/info/rules')}/>
            <Tile icon="Headset" title={t('contacts.title')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
            {pack ? <Tile icon="MapPin" title={t('home.around')} sub={t('home.aroundSub')} onClick={() => navigate('/around')}/> : <Tile icon="BookOpen" title={t('home.guides')} sub={t('home.guidesSub')} onClick={() => navigate('/guides')}/>}
          </>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <ListRow icon="Siren" tone="danger" title={t('home.emergency')} sub={t('home.emergencySub')} onClick={() => navigate('/emergency')}/>
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
    </>
  );
}
