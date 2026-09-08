import { C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { mapUrl, telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { navigate } from '../../router.js';
import { Card, ListRow, PageHeader, SectionLabel, ghostBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { HOUSE_INFO_ICONS, Icon } from '../../ui/icons.jsx';

function InfoBlock({ icon, title, children }) {
  return (
    <Card style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: C.cardAlt, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={19}/></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{title}</div>
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
          <span style={{ color: C.textMuted, marginTop: 2 }}><Icon name="MapPin" size={22}/></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('info.address')}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{p.street}</div>
            <div style={{ fontSize: 14, color: C.textMuted }}>{p.postal}{p.district ? ' · ' + p.district : ''}</div>
          </div>
        </div>
        {tip && <div style={{ marginTop: 10, background: C.warningSoft, border: '1px solid ' + C.warningBorder, borderRadius: 10, padding: '10px 12px', fontSize: 14, lineHeight: 1.45 }}><b>{t('info.arrival')}: </b>{tip}</div>}
        <a href={mapUrl(p)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, marginTop: 12, textDecoration: 'none' }}><Icon name="ExternalLink" size={16}/>{t('info.openMap')}</a>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <ListRow icon="Siren" tone="danger" title={t('home.emergency')} sub={t('home.emergencySub')} onClick={() => navigate('/emergency')}/>
        {pack && <ListRow icon="MapPin" tone="info" title={t('home.around')} sub={t('home.aroundSub')} onClick={() => navigate('/around')}/>}
      </div>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: C.textMuted }}><Icon name="Headset" size={22}/></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t('info.reception')}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>{p.reception.hours247 ? t('info.reception247') : ''}</div>
          </div>
          <a href={telHref(p.reception.phone)} style={{ ...secondaryBtn, width: 'auto', padding: '10px 14px', textDecoration: 'none' }}><Icon name="Phone" size={16}/>{t('common.call')}</a>
        </div>
      </Card>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: C.textMuted }}><Icon name="Wifi" size={22}/></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t('info.wifi')}</div>
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
            {k === 'laundryRoom' && p.laundry === 'booking' && <div style={{ marginTop: 8 }}><button type="button" style={{ ...secondaryBtn, minHeight: 40, fontSize: 14 }} onClick={() => navigate('/laundry')}><Icon name="WashingMachine" size={16}/>{t('svc.laundryBooking')}</button></div>}
          </InfoBlock>
        ))}
        <ListRow icon="ShieldCheck" title={t('info.rules')} sub={t('rules.readFull')} onClick={() => navigate('/info/rules')}/>
        <ListRow icon="BookOpen" title={t('guides.title')} sub={t('guides.sub')} onClick={() => navigate('/guides')}/>
        <ListRow icon="Headset" title={t('contacts.title')} sub={t('home.askSub')} onClick={() => navigate('/contacts')}/>
      </div>
    </>
  );
}
