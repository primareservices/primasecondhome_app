import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { getPermitExpiry, listAnnouncements, listBookings, listRequests, subscribe } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { fmtDate } from '../../lib/format.js';
import { nextCleaningDate } from '../../domain/cleaning.js';
import { isOpen } from '../../domain/request-status.js';
import { parseRoomLoc, roomLabel } from '../../domain/room-codes.js';
import { slotLabel, upcomingBooking } from '../../domain/laundry.js';
import { permitStatus } from '../../domain/permit.js';
import { pickText } from '../../content/index.js';
import { BigAction, Card, IconBox, ListRow, QuickAction, SectionLabel, Tag, Tile, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

function HeroChip({ icon, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}><Icon name={icon} size={14}/>{children}</span>;
}
export function AnnouncementCard({ a, lang, onClick }) {
  const tx = a.texts[lang] || a.texts.en || Object.values(a.texts)[0];
  const tone = a.severity === 'urgent' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info';
  const icon = a.severity === 'urgent' ? 'Siren' : a.severity === 'warning' ? 'AlertTriangle' : 'Megaphone';
  const { t } = useT();
  return (
    <Card onClick={onClick} style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Tag tone={tone} icon={icon}>{t(a.severity === 'urgent' ? 'ann.urgent' : a.severity === 'warning' ? 'ann.warning' : 'ann.info')}</Tag>
        {a.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND.red }}/>}
        <span style={{ flex: 1 }}/>
        <span style={{ fontSize: 12, color: C.textFaint, fontWeight: 700 }}>{fmtDate(a.validFrom, lang)}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{tx.title}</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4, lineHeight: 1.45 }}>{pickText(tx.body, lang)}</div>
    </Card>
  );
}
function TodayRow({ icon, tone, title, sub, right, onClick, last }) {
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', background: 'none', border: 'none', borderBottom: last ? 'none' : '1px solid ' + C.border, color: C.text }}>
      <IconBox name={icon} tone={tone}/>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{sub}</span>}</span>
      {right || <Icon name="ChevronRight" size={20} color={C.textFaint}/>}
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
  const permitExpiry = useMemo(() => stay ? getPermitExpiry(stay.id) : null, [stay, tick]);
  const permit = useMemo(() => stay ? permitStatus(permitExpiry) : null, [stay, permitExpiry]);
  const open = reqs.filter(isOpen);
  const cleaning = nextCleaningDate();
  const today = new Date().toISOString().slice(0, 10);
  const loc = stay ? parseRoomLoc(stay.room) : null;

  return (
    <>
      {stay ? (
        <div style={{ background: BRAND.wineGradient, color: '#fff', borderRadius: 28, padding: '22px 20px 20px', position: 'relative', overflow: 'hidden', boxShadow: '0 22px 44px rgba(74,15,27,0.28)' }}>
          <svg width="220" height="220" viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', right: -22, bottom: -30, opacity: 0.08 }}><path d="M50 24 L18 50 H27 V78 H44 V60 H56 V78 H73 V50 H82 Z" fill="#fff"/><rect x="62" y="28" width="7" height="14" fill="#fff"/></svg>
          <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>{t('home.hello', { name: stay.displayName })}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
            <div className="num" style={{ fontSize: 56, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em' }}>{roomLabel(stay.room)}</div>
            <div style={{ paddingBottom: 8, fontSize: 13, opacity: 0.75, lineHeight: 1.3 }}>{t('home.room')}{loc && loc.floor != null ? <><br/>{loc.floor}. p.</> : null}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <HeroChip icon="MapPin">{property.name}</HeroChip>
            <HeroChip icon="Calendar">{t('home.checkOut')} {fmtDate(stay.checkOut, lang)}</HeroChip>
            <HeroChip icon="Sparkles">{t('home.nextCleaning')} {fmtDate(cleaning.toISOString(), lang)}</HeroChip>
          </div>
        </div>
      ) : (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <IconBox name="Info" tone="info"/>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>{t('home.publicMode')} · {property ? property.name : ''}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{t('home.publicModeSub')}</div>
            </div>
          </div>
          <button type="button" style={primaryBtn} onClick={() => navigate('/welcome?step=code')}><Icon name="KeyRound" size={18}/>{t('home.signInCta')}</button>
        </Card>
      )}

      {stay && <div style={{ marginTop: 16 }}><BigAction icon="Wrench" title={t('home.reportProblem')} sub={t('home.reportSub')} onClick={() => navigate('/report')}/></div>}

      {stay ? (
        <div className="quick" style={{ marginTop: 18 }}>
          <QuickAction icon="WashingMachine" title={t('svc.laundry')} onClick={() => navigate(property.laundry === 'booking' ? '/laundry' : '/services')}/>
          <QuickAction icon="Headset" title={t('contacts.reception')} onClick={() => navigate('/contacts')}/>
          <QuickAction icon="FileCheck" title={t('home.documents')} onClick={() => navigate('/documents')}/>
          {pack ? <QuickAction icon="MapPin" title={t('home.around')} onClick={() => navigate('/around')}/> : <QuickAction icon="BookOpen" title={t('guides.title')} onClick={() => navigate('/guides')}/>}
        </div>
      ) : (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <Tile icon="Building2" title={t('info.title')} sub={property ? property.street : ''} onClick={() => navigate('/info')}/>
          <Tile icon="ShieldCheck" title={t('rules.title')} sub={t('rules.readFull')} onClick={() => navigate('/info/rules')}/>
          <Tile icon="Headset" title={t('contacts.title')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
          {pack ? <Tile icon="MapPin" title={t('home.around')} sub={t('home.aroundSub')} onClick={() => navigate('/around')}/> : <Tile icon="BookOpen" title={t('home.guides')} sub={t('home.guidesSub')} onClick={() => navigate('/guides')}/>}
        </div>
      )}

      {stay && (booking || permit || open.length > 0) && (
        <>
          <SectionLabel action={<span style={{ fontSize: 13, fontWeight: 800, color: BRAND.red }}>{fmtDate(new Date().toISOString(), lang)}</span>}>{t('home.today')}</SectionLabel>
          <Card style={{ padding: '4px 18px' }}>
            {booking && <TodayRow icon="WashingMachine" tone="info" title={t('home.laundryBooking', { slot: (booking.day === today ? '' : fmtDate(booking.day, lang) + ' ') + slotLabel(booking.start, booking.len || 2), n: booking.machine })} sub={t('laundry.fee', { price: (pack && pack.facts && pack.facts.laundry && pack.facts.laundry.price) || '2,30 €' })} right={<Tag tone="ink" style={{ height: 30, fontSize: 13 }}><span className="num">{String(booking.start).padStart(2, '0')}:00</span></Tag>} onClick={() => navigate('/laundry')} last={!permit && !open.length}/>}
            {permit && <TodayRow icon="FileCheck" tone={permit.set ? (permit.tone === 'success' ? 'success' : permit.tone) : 'info'} title={!permit.set ? t('home.permitSet') : permit.expired ? t('home.permitExpired') : t('home.permitDays', { n: permit.days })} sub={permit.set ? t('docs.permitValidUntil') + ' ' + fmtDate(permitExpiry, lang) + ' · ' + t('docs.permitReminders') + ' 90 / 60 / 30' : t('docs.permitSet')} onClick={() => navigate('/documents')} last={!open.length}/>}
            {open.length > 0 && <TodayRow icon="ClipboardList" tone="default" title={t('home.openRequests')} sub={open.map(r => r.ref).join(' · ')} right={<Tag tone="danger">{open.length}</Tag>} onClick={() => navigate('/requests')} last/>}
          </Card>
        </>
      )}

      <button type="button" onClick={() => navigate('/emergency')} className="press" style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 20, background: C.navy, color: '#fff', border: 'none', textAlign: 'left' }}>
        <IconBox name="Siren" tone="danger"/>
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{t('home.emergency')}</span><span style={{ display: 'block', fontSize: 13, opacity: 0.65, marginTop: 3 }}>{t('home.emergencySub')}</span></span>
        <Icon name="ChevronRight" size={20} style={{ opacity: 0.6 }}/>
      </button>

      <SectionLabel action={anns.length > 2 && <button type="button" onClick={() => navigate('/announcements')} style={{ background: 'none', border: 'none', color: BRAND.red, fontSize: 13, fontWeight: 800 }}>{t('common.all')}</button>}>
        {t('home.announcements')}
      </SectionLabel>
      {anns.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {anns.slice(0, 3).map(a => <AnnouncementCard key={a.id} a={a} lang={lang} onClick={() => navigate('/announcements')}/>)}
        </div>
      ) : <div style={{ fontSize: 14, color: C.textMuted, padding: '4px 2px' }}>{t('home.noAnnouncements')}</div>}
      {!stay && <div style={{ marginTop: 12 }}><ListRow icon="ClipboardList" title={t('requests.title')} sub={t('home.publicModeSub')} onClick={() => navigate('/welcome?step=code')}/></div>}
    </>
  );
}
