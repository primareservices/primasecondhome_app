import { BRAND, C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { mapUrl, telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { navigate } from '../../router.js';
import { Card, IconBox, ListRow, PageHeader, SectionLabel, ghostBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { HOUSE_INFO_ICONS, Icon } from '../../ui/icons.jsx';

function InfoBlock({ icon, title, children }) {
  return (
    <Card style={{ padding: '14px 16px', display: 'flex', gap: 12 }}>
      <IconBox name={icon} size={40} iconSize={20} radius={14}/>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{children}</div>
      </div>
    </Card>
  );
}
export function Info() {
  const { t } = useT();
  const { property: p, content, pack, publicMode } = useApp();
  const tip = content.arrivalTips[p.arrivalTipKey];
  const hi = content.houseInfo;
  // Text budovy z content packu má prednosť pred sieťovým textom.
  const pt = (pack && pack.factsText) || {};
  const extra = { quiet: p.quietHours, cleaning: t('info.workdays'), parking: p.parkingSpots ? t('info.parkingSpots', { n: p.parkingSpots }) : null };
  const body = (k) => (k === 'laundryRoom' && pt.laundry) || (k === 'cleaning' && pt.cleaning) || (k === 'parking' && pt.parking) || (k === 'card' && pt.access ? pt.access + ' ' + hi.card : null) || hi[k];
  return (
    <>
      <PageHeader title={t('info.title')} sub={p.name + (p.beds ? ' · ' + p.beds + ' ' + t('info.beds') : '')}
        action={publicMode && <button type="button" style={{ ...ghostBtn, fontSize: 13 }} onClick={() => navigate('/welcome?step=public')}>{t('common.change')}</button>}/>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <IconBox name="MapPin" tone="brand"/>
          <div style={{ flex: 1 }}>
            <div className="label">{t('info.address')}</div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>{p.street}</div>
            <div style={{ fontSize: 14, color: C.textMuted }}>{p.postal}{p.district ? ' · ' + p.district : ''}</div>
          </div>
        </div>
        {tip && <div style={{ marginTop: 12, background: C.warningSoft, borderRadius: 16, padding: '12px 14px', fontSize: 14, lineHeight: 1.45 }}><b>{t('info.arrival')}: </b>{tip}</div>}
        <a href={mapUrl(p)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, marginTop: 12, textDecoration: 'none' }}><Icon name="ExternalLink" size={16}/>{t('info.openMap')}</a>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <ListRow icon="Siren" tone="danger" title={t('home.emergency')} sub={t('home.emergencySub')} onClick={() => navigate('/emergency')}/>
        {pack && <ListRow icon="MapPin" tone="info" title={t('home.around')} sub={t('home.aroundSub')} onClick={() => navigate('/around')}/>}
      </div>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <IconBox name="Headset" tone="info"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{t('info.reception')}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>{p.reception.hours247 ? t('info.reception247') : ''}</div>
          </div>
          <a href={telHref(p.reception.phone)} style={{ ...secondaryBtn, width: 'auto', minHeight: 40, padding: '0 14px', fontSize: 13, borderRadius: 999, boxShadow: 'inset 0 0 0 1.5px rgba(23,22,26,0.08)', textDecoration: 'none' }}><Icon name="Phone" size={15}/>{t('common.call')}</a>
        </div>
      </Card>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <IconBox name="Wifi" tone="success"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{t('info.wifi')}</div>
            {p.wifi.ssid ? (
              <div style={{ fontSize: 14, marginTop: 2 }}>{t('info.wifiName')}: <b style={{ fontFamily: monoFamily }}>{p.wifi.ssid}</b> · {t('info.wifiPass')}: <b style={{ fontFamily: monoFamily }}>{p.wifi.password || t('info.notSet')}</b>{pt.wifi5g && <span style={{ color: C.textMuted }}> · {pt.wifi5g}</span>}</div>
            ) : <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>{t('info.notSet')}</div>}
          </div>
        </div>
      </Card>
      <SectionLabel>{t('info.title')}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pt.rooms && <InfoBlock icon="Bed" title={t('info.rooms')}>{pt.rooms}</InfoBlock>}
        {['kitchen', 'laundryRoom', 'quiet', 'cleaning', 'waste', 'smoking', 'visitors', 'parking', 'card'].map(k => (
          <InfoBlock key={k} icon={HOUSE_INFO_ICONS[k]} title={t('info.' + k) + (extra[k] ? ' · ' + extra[k] : '')}>
            {body(k)}
            {k === 'laundryRoom' && p.laundry === 'booking' && <div style={{ marginTop: 8 }}><button type="button" style={{ ...secondaryBtn, minHeight: 44, fontSize: 14, background: BRAND.redSoft, color: BRAND.red, boxShadow: 'none' }} onClick={() => navigate('/laundry')}><Icon name="WashingMachine" size={16}/>{t('svc.laundryBooking')}</button></div>}
          </InfoBlock>
        ))}
        <ListRow icon="ShieldCheck" title={t('info.rules')} sub={t('rules.readFull')} onClick={() => navigate('/info/rules')}/>
        <ListRow icon="BookOpen" title={t('guides.title')} sub={t('guides.sub')} onClick={() => navigate('/guides')}/>
        <ListRow icon="Headset" title={t('contacts.title')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
      </div>
    </>
  );
}
