import { useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK } from '../../config/app-config.js';
import { telHref } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back } from '../../router.js';
import { parseRoomLoc, roomLabel } from '../../domain/room-codes.js';
import { Card, IconBox, KeyValue, iconBtn, inkBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

// Núdzová karta (smer A): červená hlavička s veľkou 112 a tromi malými číslami,
// adresa pre operátora po slovensky (doplnená z pobytu), postup pri alarme, lekárnička.
// Bez siete funguje z cache.
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
      <div className="bleed" style={{ background: BRAND.redGradient, color: '#fff', padding: '14px 20px 24px', marginTop: -8, borderRadius: '0 0 36px 36px', boxShadow: '0 18px 40px rgba(142,26,40,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={() => back('/')} aria-label={t('common.back')} style={{ ...iconBtn, background: 'rgba(255,255,255,0.16)', color: '#fff', boxShadow: 'none' }}><Icon name="ChevronLeft" size={22}/></button>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>{p.name}</span>
        </div>
        <h1 style={{ margin: '22px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{t('home.emergency')}</h1>
        <div style={{ fontSize: 14, opacity: 0.88, marginTop: 8, lineHeight: 1.45 }}>{t('emg.sub')}</div>
        <a href={'tel:' + E.general} className="press" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 24, background: '#fff', color: C.text, boxShadow: '0 16px 36px rgba(23,22,26,0.2)', textDecoration: 'none' }}>
          <IconBox name="Phone" tone="danger" size={54} iconSize={26} radius={18}/>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="num" style={{ display: 'block', fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{E.general}</span>
            <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 4, lineHeight: 1.35 }}>{t('contacts.e112')} · {t('emg.e112Hint')}</span>
          </span>
        </a>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
          {[['e155', E.ambulance], ['e150', E.fire], ['e158', E.police]].map(([k, num]) => (
            <a key={k} href={'tel:' + num} className="press" style={{ padding: 12, borderRadius: 18, background: 'rgba(255,255,255,0.14)', textAlign: 'center', color: '#fff', textDecoration: 'none' }}>
              <b className="num" style={{ display: 'block', fontSize: 22 }}>{num}</b>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{t('contacts.' + k)}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
        <Card>
          <div className="label" style={{ color: BRAND.red }}>{t('emg.read')}</div>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', marginTop: 8 }}>{base}{place && <>, <span style={{ color: BRAND.red }}>{place}</span></>}</div>
          {stay && <div className="hint" style={{ marginTop: 8 }}>{t('emg.readHint')}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="button" style={{ ...secondaryBtn, flex: 1, minHeight: 46, fontSize: 14 }} onClick={copy}><Icon name={copied ? 'Check' : 'Copy'} size={16}/>{copied ? t('common.copied') : t('common.copy')}</button>
            <button type="button" style={{ ...inkBtn, flex: 1, minHeight: 46, fontSize: 14, boxShadow: 'none' }} onClick={speak}><Icon name="Volume2" size={16}/>{t('emg.speak')}</button>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}><IconBox name="Flame" tone="warning"/><b style={{ fontSize: 16, letterSpacing: '-0.01em' }}>{t('emg.fire')}</b></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((s, i) => (
              <div key={i} className="step">
                <span className="n">{i + 1}</span>
                <span style={{ fontSize: 15, lineHeight: 1.4, paddingTop: 4 }}>{s}{i === 1 && emg && <> — <b>{emg.assembly.replace(/^[^:]+:\s*/, '')}</b>{facts && facts.assemblyGate ? ', ' + facts.assemblyGate : ''}</>}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: '4px 18px' }}>
          <KeyValue label={t('emg.firstAid')} value={emg ? emg.firstAid.replace(/^[^:]+:\s*/, '') : t('contacts.reception')}/>
          <KeyValue label={t('emg.defib')} value={(facts && facts.defibrillator) || <span style={{ color: C.textFaint, fontWeight: 600 }}>{t('info.notSet')}</span>}/>
          <KeyValue label={t('contacts.reception') + ' 24/7'} value={receptionPhone} mono/>
        </Card>
        <a href={telHref(receptionPhone)} style={{ ...secondaryBtn, textDecoration: 'none' }}><Icon name="Phone" size={18}/>{t('emg.callReception')}</a>
      </div>
    </>
  );
}
