import { useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK, shadow } from '../../config/app-config.js';
import { mapUrl, telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back, navigate } from '../../router.js';
import { Banner, Card, Chip, IconBox, KeyValue, ListRow, PageHeader, SectionLabel, Tag, iconBtn, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const SECTION_ICON = { transport: 'Bus', shopping: 'ShoppingBag', health: 'HeartPulse', money: 'Banknote', authorities: 'Landmark', worship: 'Church', leisure: 'Sun' };
const mapHref = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

// Malé okrúhle tlačidlo „Mapa" na konci riadku.
function MapBtn({ q, t, dark }) {
  if (!q) return null;
  return <a href={mapHref(q)} target="_blank" rel="noreferrer" aria-label={t('around.map')} style={{ ...iconBtn, width: 38, height: 38, boxShadow: 'none', background: dark ? 'rgba(255,255,255,0.12)' : C.cardAlt, color: dark ? '#fff' : C.textMuted, textDecoration: 'none' }}><Icon name="MapPin" size={17}/></a>;
}
function Row({ icon, title, sub, walk, q, t, tone = 'default', right }) {
  return (
    <div className="row">
      <IconBox name={icon} tone={tone}/>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{title}</span>
          {walk != null && <Tag tone="muted"><span className="num">{walk} min</span></Tag>}
        </span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{sub}</span>}
      </span>
      {right}
      <MapBtn q={q} t={t}/>
    </div>
  );
}
// Ilustračná mapka (bez siete, bez API) so špendlíkom budovy a adresou.
function MapCard({ p }) {
  return (
    <div style={{ position: 'relative', height: 170, borderRadius: 24, overflow: 'hidden', background: '#EFE7DE', boxShadow: shadow.sm }}>
      <svg viewBox="0 0 350 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="350" height="170" fill="#EFE7DE"/>
        <path d="M-10 118 C 60 112, 120 96, 200 92 S 330 84, 370 70" stroke="#FFFFFF" strokeWidth="16" fill="none" strokeLinecap="round"/>
        <path d="M-10 118 C 60 112, 120 96, 200 92 S 330 84, 370 70" stroke="#E3D9CD" strokeWidth="2" fill="none" strokeDasharray="6 8"/>
        <path d="M120 -10 C 126 40, 150 90, 172 180" stroke="#FFFFFF" strokeWidth="12" fill="none"/>
        <path d="M250 -10 C 236 50, 240 110, 262 180" stroke="#FFFFFF" strokeWidth="10" fill="none"/>
        <rect x="40" y="30" width="46" height="34" rx="6" fill="#E4DBCF"/><rect x="196" y="112" width="60" height="38" rx="6" fill="#E4DBCF"/><rect x="290" y="100" width="44" height="50" rx="6" fill="#E4DBCF"/>
        <circle cx="318" cy="52" r="26" fill="#DCE8DA"/><circle cx="40" cy="150" r="30" fill="#DCE8DA"/>
        <circle cx="176" cy="86" r="22" fill="rgba(189,36,53,0.16)"/>
        <path d="M176 60 c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill={BRAND.red}/><circle cx="176" cy="76" r="6" fill="#FFFFFF"/>
      </svg>
      <a href={mapUrl(p)} target="_blank" rel="noreferrer" style={{ position: 'absolute', left: 14, bottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 999, background: C.navy, color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}><Icon name="MapPin" size={14}/>{p.street}</a>
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
        <MapCard p={p}/>
        <Banner tone="info" icon="Info" style={{ marginTop: 14 }}>{t('around.noPack')}</Banner>
        <div style={{ marginTop: 12 }}><ListRow icon="BookOpen" title={t('guides.title')} sub={t('guides.sub')} onClick={() => navigate('/guides')}/></div>
      </>
    );
  }
  const F = pack.facts.places; const S = pack.city.sections; const I = (k) => (S[sec] && S[sec].items[k]) || '';
  const keys = Object.keys(S);
  const rows = { padding: '4px 18px' };
  // Text k polícii z packu: „Názov — adresa. Hodiny. Poznámka." → bez prvej vety (tá je v titulku).
  const fp = I('foreignPolice'); const fpBody = fp.includes('. ') ? fp.slice(fp.indexOf('. ') + 2) : fp;
  return (
    <>
      <PageHeader title={pack.city.title} sub={t('around.sub')} onBack={() => back('/info')}
        action={<a href={mapUrl(p)} target="_blank" rel="noreferrer" aria-label={t('info.openMap')} style={{ ...iconBtn, textDecoration: 'none' }}><Icon name="MapPin" size={20}/></a>}/>
      <MapCard p={p}/>
      <div className="chips" style={{ margin: '16px 0 14px' }}>
        {keys.map(k => <Chip key={k} active={sec === k} icon={SECTION_ICON[k]} onClick={() => setSec(k)}>{S[k].title}</Chip>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sec === 'transport' && <>
          <Card className="rows" style={rows}>
            <Row icon="Bus" tone="info" title={F.busStop.name} sub={I('busStop')} walk={3} q={F.busStop.map} t={t}/>
            <Row icon="TramFront" tone="info" title={F.tram.line + ' · ' + F.tram.name} sub={I('tram')} walk={F.tram.walkMin} q={F.tram.map} t={t}/>
          </Card>
          <Card>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><b style={{ fontSize: 16, flex: 1, letterSpacing: '-0.01em' }}>{t('around.tickets')}</b><span style={{ fontSize: 12, color: C.textFaint, fontWeight: 700 }}>{t('around.ticketsFrom', { date: '1. 7. 2026' })}</span></div>
            <div style={{ marginTop: 6 }}>
              {pack.facts.tickets.single.map(([k, paper, app]) => <KeyValue key={k} label={k} value={<span className="num">{paper} <span style={{ color: C.infoText }}>· {app} {t('around.inApp')}</span></span>}/>)}
              {pack.facts.tickets.passes.map(([k, v]) => <KeyValue key={k} label={k} value={v} mono/>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '12px 14px', borderRadius: 16, background: C.warningSoft, color: '#7A4B0C', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
              <Icon name="AlertTriangle" size={18} style={{ flexShrink: 0 }}/><span>{t('around.fine', { a: pack.facts.tickets.fine[0], b: pack.facts.tickets.fine[1], c: pack.facts.tickets.fine[2] })} {t('around.reimburse')}</span>
            </div>
          </Card>
        </>}
        {sec === 'shopping' && (
          <Card className="rows" style={rows}>
            <Row icon="ShoppingBag" title={F.mall.name} sub={I('mall')} walk={F.mall.walkMin} q={F.mall.map} t={t}/>
            <Row icon="ShoppingBag" title={F.grocery.name || F.grocery.candidates.join(', ')} sub={I('grocery')} walk={F.grocery.walkMin} q={F.grocery.map} t={t}/>
            <Row icon="HeartPulse" tone="success" title={F.pharmacy.name || F.pharmacy.candidates[0]} sub={I('pharmacy')} walk={F.pharmacy.walkMin} q={F.pharmacy.map} t={t}/>
          </Card>
        )}
        {sec === 'health' && <>
          <Card className="rows" style={rows}>
            <Row icon="HeartPulse" tone="info" title={F.hospital.name} sub={F.hospital.address + ' · ' + I('hospital')} q={F.hospital.map} t={t}/>
            <Row icon="HeartPulse" title={F.gp.name || F.gp.candidates[0]} sub={I('gp')} q={F.gp.map} t={t}/>
          </Card>
          <ListRow icon="Siren" tone="danger" title={t('home.emergency')} sub={t('home.emergencySub')} onClick={() => navigate('/emergency')}/>
        </>}
        {sec === 'money' && (
          <Card className="rows" style={rows}>
            <Row icon="Banknote" tone="success" title={F.post.name} sub={F.post.address + ' · ' + I('post') + ' · ' + F.post.hours} q={F.post.map} t={t}/>
            <Row icon="Send" title={F.novaPost.name} sub={F.novaPost.address + ' · ' + I('novaPost')} q={F.novaPost.map} t={t}/>
            <Row icon="Inbox" title={F.parcelBoxes.name || F.parcelBoxes.candidates[0]} sub={I('parcelBoxes')} q={F.parcelBoxes.map} t={t}/>
          </Card>
        )}
        {sec === 'authorities' && <>
          <div style={{ background: C.navy, color: '#fff', borderRadius: C.radius, padding: 18, boxShadow: '0 16px 36px rgba(23,22,26,0.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBox name="Landmark" tone="danger"/>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{F.foreignPolice.name}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 1.4 }}>{F.foreignPolice.address}</span>
              </span>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.45, color: 'rgba(255,255,255,0.85)' }}>{fpBody || t('around.appointment')}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <a href={NETWORK.foreignPoliceUrl} target="_blank" rel="noreferrer" style={{ ...primaryBtn, flex: 1, minHeight: 46, fontSize: 14, boxShadow: 'none', textDecoration: 'none' }}>{t('around.bookAppointment')}</a>
              <MapBtn q={F.foreignPolice.map} t={t} dark/>
            </div>
          </div>
          <Card className="rows" style={rows}>
            <Row icon="Users" tone="success" title={F.iom.name} sub={I('iom')} t={t}
              right={<a href={telHref(F.iom.phone)} style={{ ...secondaryBtn, width: 'auto', minHeight: 34, padding: '0 12px', fontSize: 12, borderRadius: 999, boxShadow: 'inset 0 0 0 1.5px rgba(23,22,26,0.08)', textDecoration: 'none' }}><Icon name="Phone" size={14}/>{t('around.call')}</a>}/>
          </Card>
          <SectionLabel style={{ margin: '4px 2px -4px' }}>{I('embassies')}</SectionLabel>
          <Card className="rows" style={rows}>
            {F.embassies.map(e => <Row key={e.country} icon="Landmark" title={e.name} sub={e.address} q={e.map} t={t}/>)}
          </Card>
        </>}
        {sec === 'worship' && (
          <Card className="rows" style={rows}>
            {F.worship.filter(w => w.name).map(w => <Row key={w.key} icon="Church" title={w.name} sub={(I(w.key) || '') + (w.hours ? ' · ' + w.hours : '')} q={w.map} t={t}/>)}
          </Card>
        )}
        {sec === 'leisure' && (
          <Card className="rows" style={rows}>
            {F.leisure.filter(l => l.name).map(l => <Row key={l.key} icon="Sun" tone="warning" title={l.name} sub={I(l.key)} q={l.map} t={t}/>)}
          </Card>
        )}
      </div>
      <div style={{ fontSize: 12, color: C.textFaint, textAlign: 'center', margin: '18px 0 6px', lineHeight: 1.45, fontWeight: 600 }}>{t('around.sources')}</div>
    </>
  );
}
