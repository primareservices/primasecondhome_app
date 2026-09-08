import { BRAND, C } from '../../config/theme.js';
import { NETWORK, shadow } from '../../config/app-config.js';
import { telHref, telegramHref, viberHref, whatsappHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back } from '../../router.js';
import { Banner, Card, IconBox, PageHeader, SectionLabel, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

function LinkBtn({ href, icon, children, primary }) {
  return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ ...secondaryBtn, width: 'auto', minHeight: 46, padding: '0 14px', fontSize: 14, textDecoration: 'none', flex: '1 1 auto', ...(primary ? { background: BRAND.red, color: '#fff', boxShadow: '0 10px 24px ' + BRAND.redGlow } : null) }}><Icon name={icon} size={16}/>{children}</a>;
}
function ContactCard({ icon, title, sub, children, note }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: children ? 10 : 0 }}>
        <IconBox name={icon}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.4 }}>{sub}</div>}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>}
      {note && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8, lineHeight: 1.45 }}>{note}</div>}
    </Card>
  );
}
export function Contacts() {
  const { t } = useT();
  const { stay, property: p } = useApp();
  const m = p.messengers || {};
  const E = NETWORK.emergency;
  return (
    <>
      <PageHeader title={t('contacts.title')} sub={p.name} onBack={() => back('/')}/>
      <ContactCard icon="Headset" title={t('contacts.reception') + ' · ' + p.name} sub={p.reception.hours247 ? t('info.reception247') : ''} note={t('contacts.langNote')}>
        <LinkBtn href={telHref(p.reception.phone)} icon="Phone" primary>{t('common.call')}</LinkBtn>
        <LinkBtn href={'mailto:' + p.reception.email} icon="Mail">{t('common.email')}</LinkBtn>
        {m.whatsapp && <LinkBtn href={whatsappHref(m.whatsapp)} icon="MessageCircle">{t('contacts.whatsapp')}</LinkBtn>}
        {m.viber && <LinkBtn href={viberHref(m.viber)} icon="MessageCircle">{t('contacts.viber')}</LinkBtn>}
        {m.telegram && <LinkBtn href={telegramHref(m.telegram)} icon="Send">{t('contacts.telegram')}</LinkBtn>}
      </ContactCard>
      {stay && stay.coordinator && (
        <ContactCard icon="Users" title={t('contacts.coordinator')} sub={stay.coordinator.name + ' · ' + stay.company}>
          <LinkBtn href={telHref(stay.coordinator.phone)} icon="Phone">{t('common.call')}</LinkBtn>
          <LinkBtn href={whatsappHref(stay.coordinator.phone)} icon="MessageCircle">{t('contacts.whatsapp')}</LinkBtn>
        </ContactCard>
      )}
      <ContactCard icon="Building2" title={t('contacts.office')} sub={t('contacts.officeHours')}>
        <LinkBtn href={telHref(NETWORK.officePhone)} icon="Phone">{t('common.call')}</LinkBtn>
        <LinkBtn href={'mailto:' + NETWORK.officeEmail} icon="Mail">{t('common.email')}</LinkBtn>
      </ContactCard>
      <ContactCard icon="FileCheck" title={t('contacts.confirmations')} sub={NETWORK.confirmationsEmail}>
        <LinkBtn href={telHref(NETWORK.confirmationsPhone)} icon="Phone">{t('common.call')}</LinkBtn>
      </ContactCard>

      <SectionLabel>{t('contacts.emergency')}</SectionLabel>
      <Banner tone="danger" icon="Siren" style={{ marginBottom: 10 }}>{t('contacts.emergencySub')}</Banner>
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {[['e112', E.general, 'Siren'], ['e155', E.ambulance, 'HeartPulse'], ['e150', E.fire, 'Flame'], ['e158', E.police, 'ShieldCheck']].map(([k, num, icon]) => (
          <a key={k} href={'tel:' + num} className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 68, background: C.card, boxShadow: shadow.sm, borderRadius: C.radius, textDecoration: 'none', color: C.text }}>
            <IconBox name={icon} tone={k === 'e112' ? 'danger' : 'brand'} size={40} iconSize={20} radius={14}/>
            <span><b className="num" style={{ display: 'block', fontSize: 22, lineHeight: 1.1 }}>{num}</b><span style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>{t('contacts.' + k)}</span></span>
          </a>
        ))}
      </div>
      <ContactCard icon="LifeBuoy" title={t('contacts.iom')} sub={t('contacts.iomSub')}>
        <LinkBtn href={telHref(NETWORK.iomPhone)} icon="Phone">{NETWORK.iomPhone}</LinkBtn>
        <LinkBtn href={NETWORK.iomWeb} icon="ExternalLink">mic.iom.sk</LinkBtn>
      </ContactCard>
    </>
  );
}
