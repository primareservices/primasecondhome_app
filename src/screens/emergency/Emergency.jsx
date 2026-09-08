import { useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK, monoFamily } from '../../config/app-config.js';
import { telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back } from '../../router.js';
import { parseRoomLoc, roomLabel } from '../../domain/room-codes.js';
import { Card, KeyValue, SectionLabel, ghostBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

// Núdzová karta: čísla na jeden ťuk, adresa pre operátora po slovensky (doplnená z pobytu),
// postup pri alarme, zhromaždisko, lekárnička. Bez siete funguje z cache.
export function Emergency() {
  const { t } = useT();
  const { stay, property: p, pack } = useApp();
  const [copied, setCopied] = useState(false);
  const E = NETWORK.emergency;
  const emg = pack && pack.emergency;
  const facts = pack && pack.facts && pack.facts.emergency;
  const base = (facts && facts.addressToRead) || (p.street + ', ' + p.city + (p.district ? ' – ' + p.district : '') + ', ubytovňa ' + p.name);
  let place = '';
  if (stay) {
    const loc = parseRoomLoc(stay.room);
    place = t('emg.place', { b: loc.block || p.qr, f: loc.floor == null ? '–' : loc.floor, r: roomLabel(stay.room) });
  }
  const full = base + (place ? ', ' + place : '');
  const copy = async () => { try { await navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  const speak = () => { try { const u = new SpeechSynthesisUtterance(full); u.lang = 'sk-SK'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {} };
  const steps = (emg && emg.steps) || [t('emg.step1'), t('emg.step2'), t('emg.step3'), t('emg.step4')];
  const receptionPhone = (facts && facts.receptionPhone) || p.reception.phone;

  return (
    <>
      <div style={{ background: BRAND.red, color: '#fff', margin: '-12px -14px 14px', padding: '14px 16px 18px' }}>
        <button type="button" onClick={() => back('/')} style={{ ...ghostBtn, color: '#fff', padding: '4px 0', marginLeft: -4 }}><Icon name="ChevronLeft" size={22}/><span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>{p.name}</span></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="Siren" size={30}/></span>
          <div><h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{t('home.emergency')}</h1><div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{t('emg.sub')}</div></div>
        </div>
      </div>
      <div className="grid-2">
        {[['e112', E.general, 'Siren'], ['e155', E.ambulance, 'HeartPulse'], ['e150', E.fire, 'Flame'], ['e158', E.police, 'ShieldCheck']].map(([k, num, icon]) => (
          <a key={k} href={'tel:' + num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', minHeight: 72, background: C.card, border: '1px solid ' + C.border, borderRadius: C.radius, textDecoration: 'none', color: C.text }}>
            <span style={{ color: BRAND.red, display: 'flex' }}><Icon name={icon} size={24}/></span>
            <span><b style={{ display: 'block', fontSize: 26, letterSpacing: '0.02em', lineHeight: 1.1 }}>{num}</b><span style={{ fontSize: 12, color: C.textMuted }}>{t('contacts.' + k)}</span></span>
          </a>
        ))}
      </div>
      <Card style={{ marginTop: 12 }}>
        <SectionLabel style={{ margin: '0 0 8px' }}>{t('emg.read')}</SectionLabel>
        <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{base}{place && <>, <span style={{ color: BRAND.red }}>{place}</span></>}</div>
        {stay && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>{t('emg.readHint')}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1, minHeight: 44, fontSize: 14 }} onClick={copy}><Icon name={copied ? 'Check' : 'Copy'} size={16}/>{copied ? t('common.copied') : t('common.copy')}</button>
          <button type="button" style={{ ...secondaryBtn, flex: 1, minHeight: 44, fontSize: 14 }} onClick={speak}><Icon name="Languages" size={16}/>{t('emg.speak')}</button>
        </div>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><span style={{ width: 38, height: 38, borderRadius: 10, background: C.warningSoft, color: C.warningText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="Flame" size={19}/></span><b style={{ fontSize: 16 }}>{t('emg.fire')}</b></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, lineHeight: 1.4 }}>
          {steps.map((s, i) => <div key={i} style={{ display: 'flex', gap: 10 }}><b style={{ color: BRAND.red, width: 20, fontFamily: monoFamily }}>{i + 1}</b><span>{s}{i === 1 && emg && <> — <b>{emg.assembly.replace(/^[^:]+:\s*/, '')}</b>{facts && facts.assemblyGate ? ', ' + facts.assemblyGate : ''}</>}</span></div>)}
        </div>
      </Card>
      <Card style={{ marginTop: 12, padding: '4px 16px' }}>
        <KeyValue label={t('emg.firstAid')} value={emg ? emg.firstAid.replace(/^[^:]+:\s*/, '') : t('contacts.reception')}/>
        <KeyValue label={t('emg.defib')} value={(facts && facts.defibrillator) || t('info.notSet')}/>
        <KeyValue label={t('contacts.reception') + ' 24/7'} value={receptionPhone} mono/>
      </Card>
      <a href={telHref(receptionPhone)} style={{ ...secondaryBtn, marginTop: 12, textDecoration: 'none' }}><Icon name="Phone" size={18}/>{t('emg.callReception')}</a>
    </>
  );
}
