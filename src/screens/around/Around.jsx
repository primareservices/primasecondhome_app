import { useState } from 'react';
import { C } from '../../config/theme.js';
import { NETWORK, monoFamily } from '../../config/app-config.js';
import { mapUrl, telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back, navigate } from '../../router.js';
import { Banner, Card, Chip, KeyValue, ListRow, PageHeader, SectionLabel, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const SECTION_ICON = { transport: 'Bus', shopping: 'ShoppingBag', health: 'HeartPulse', money: 'Banknote', authorities: 'Landmark', worship: 'Landmark', leisure: 'Sun' };
const mapHref = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

function MapBtn({ q, t }) {
  if (!q) return null;
  return <a href={mapHref(q)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, width: 'auto', minHeight: 40, padding: '8px 12px', fontSize: 13, textDecoration: 'none', flexShrink: 0 }}><Icon name="MapPin" size={15}/>{t('around.map')}</a>;
}
function Row({ icon, title, sub, walk, q, t, tone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 60, background: C.card, border: '1px solid ' + C.border, borderRadius: C.radius }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, background: tone === 'info' ? C.infoSoft : tone === 'ok' ? C.successSoft : C.cardAlt, color: tone === 'info' ? C.infoText : tone === 'ok' ? C.successText : C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={19}/></span>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}</span>
      {walk != null && <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap' }}>{t('around.walk', { n: walk })}</span>}
      <MapBtn q={q} t={t}/>
    </div>
  );
}

export function Around() {
  const { t } = useT();
  const { property: p, pack } = useApp();
  const [sec, setSec] = useState('transport');
  if (!pack || !pack.city) {
    return (
      <>
        <PageHeader title={t('home.around')} sub={p.name} onBack={() => back('/info')}/>
        <Banner tone="info" icon="Info">{t('around.noPack')}</Banner>
        <a href={mapUrl(p)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, marginTop: 12, textDecoration: 'none' }}><Icon name="ExternalLink" size={16}/>{t('info.openMap')}</a>
        <div style={{ marginTop: 12 }}><ListRow icon="BookOpen" title={t('guides.title')} sub={t('guides.sub')} onClick={() => navigate('/guides')}/></div>
      </>
    );
  }
  const F = pack.facts.places; const S = pack.city.sections; const I = (k) => (S[sec] && S[sec].items[k]) || '';
  const keys = Object.keys(S);
  return (
    <>
      <PageHeader title={pack.city.title} sub={p.name + ' · ' + p.street} onBack={() => back('/info')}/>
      <div className="chips" style={{ marginBottom: 14 }}>
        {keys.map(k => <Chip key={k} active={sec === k} icon={SECTION_ICON[k]} onClick={() => setSec(k)}>{S[k].title}</Chip>)}
      </div>
      <SectionLabel style={{ marginTop: 0 }}>{S[sec].title}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sec === 'transport' && <>
          <Row icon="Bus" tone="info" title={F.busStop.name} sub={I('busStop')} walk={3} q={F.busStop.map} t={t}/>
          <Row icon="Bus" tone="info" title={F.tram.line + ' · ' + F.tram.name} sub={I('tram')} walk={F.tram.walkMin} q={F.tram.map} t={t}/>
          <Card style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t('around.tickets')} <span style={{ fontWeight: 500, color: C.textMuted, fontSize: 13 }}>· {t('around.ticketsFrom', { date: '1. 7. 2026' })}</span></div>
            {pack.facts.tickets.single.map(([k, paper, app]) => <KeyValue key={k} label={k} value={<span style={{ fontFamily: monoFamily }}>{paper} · {t('around.inApp')} {app}</span>}/>)}
            {pack.facts.tickets.passes.map(([k, v]) => <KeyValue key={k} label={k} value={v} mono/>)}
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8, lineHeight: 1.45 }}>{t('around.reimburse')}</div>
          </Card>
          <Banner tone="warning" icon="AlertTriangle">{t('around.fine', { a: pack.facts.tickets.fine[0], b: pack.facts.tickets.fine[1], c: pack.facts.tickets.fine[2] })}</Banner>
        </>}
        {sec === 'shopping' && <>
          <Row icon="ShoppingBag" title={F.mall.name} sub={I('mall')} walk={F.mall.walkMin} q={F.mall.map} t={t}/>
          <Row icon="ShoppingBag" title={F.grocery.name || F.grocery.candidates.join(', ')} sub={I('grocery')} walk={F.grocery.walkMin} q={F.grocery.map} t={t}/>
          <Row icon="HeartPulse" title={F.pharmacy.name || F.pharmacy.candidates[0]} sub={I('pharmacy')} walk={F.pharmacy.walkMin} q={F.pharmacy.map} t={t}/>
        </>}
        {sec === 'health' && <>
          <Row icon="HeartPulse" tone="info" title={F.hospital.name + ' · ' + F.hospital.address} sub={I('hospital')} q={F.hospital.map} t={t}/>
          <Row icon="HeartPulse" title={F.gp.name || F.gp.candidates[0]} sub={I('gp')} q={F.gp.map} t={t}/>
          <div style={{ marginTop: 4 }}><ListRow icon="Siren" tone="danger" title={t('home.emergency')} sub={t('home.emergencySub')} onClick={() => navigate('/emergency')}/></div>
        </>}
        {sec === 'money' && <>
          <Row icon="Banknote" title={F.post.name + ' · ' + F.post.address} sub={I('post') + ' · ' + F.post.hours} q={F.post.map} t={t}/>
          <Row icon="Send" title={F.novaPost.name + ' · ' + F.novaPost.address} sub={I('novaPost')} q={F.novaPost.map} t={t}/>
          <Row icon="Inbox" title={F.parcelBoxes.name || F.parcelBoxes.candidates[0]} sub={I('parcelBoxes')} q={F.parcelBoxes.map} t={t}/>
        </>}
        {sec === 'authorities' && <>
          <Card style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: C.cardAlt, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="Landmark" size={19}/></span>
              <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{F.foreignPolice.name}</span><span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2 }}>{F.foreignPolice.address} · {F.foreignPolice.hours}</span></span>
            </div>
            <Banner tone="danger" icon="AlertTriangle" style={{ marginTop: 10, padding: '10px 12px' }}>{t('around.appointment')}</Banner>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <a href={NETWORK.foreignPoliceUrl} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, flex: 1, minHeight: 40, fontSize: 13, textDecoration: 'none' }}><Icon name="ExternalLink" size={15}/>{t('around.bookAppointment')}</a>
              <a href={mapHref(F.foreignPolice.map)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, flex: 1, minHeight: 40, fontSize: 13, textDecoration: 'none' }}><Icon name="MapPin" size={15}/>{t('around.map')}</a>
            </div>
          </Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.card, border: '1px solid ' + C.border, borderRadius: C.radius }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: C.successSoft, color: C.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="Users" size={19}/></span>
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{F.iom.name}</span><span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{I('iom')}</span></span>
            <a href={telHref(F.iom.phone)} style={{ ...secondaryBtn, width: 'auto', minHeight: 40, padding: '8px 12px', fontSize: 13, textDecoration: 'none', flexShrink: 0 }}><Icon name="Phone" size={15}/>{t('around.call')}</a>
          </div>
          <SectionLabel>{I('embassies')}</SectionLabel>
          {F.embassies.map(e => <Row key={e.country} icon="Landmark" title={e.name} sub={e.address} q={e.map} t={t}/>)}
        </>}
        {sec === 'worship' && F.worship.filter(w => w.name).map(w => <Row key={w.key} icon="Landmark" title={w.name} sub={(I(w.key) || '') + (w.hours ? ' · ' + w.hours : '')} q={w.map} t={t}/>)}
        {sec === 'leisure' && F.leisure.filter(l => l.name).map(l => <Row key={l.key} icon="Sun" title={l.name} sub={I(l.key)} q={l.map} t={t}/>)}
      </div>
      <div style={{ fontSize: 12, color: C.textFaint, textAlign: 'center', margin: '18px 0 6px', lineHeight: 1.45 }}>{t('around.sources')}</div>
    </>
  );
}
