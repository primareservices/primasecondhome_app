import { useEffect, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { DEMO_MODE } from '../../config/app-config.js';
import { PROPERTIES } from '../../config/properties.js';
import { LANGS } from '../../config/languages.js';
import { useT } from '../../i18n/index.js';
import { navigate } from '../../router.js';
import { redeemCode, setPublicProperty } from '../../data/adapter.js';
import { DEMO_STAYS, DEMO_SURNAMES } from '../../data/seed.js';
import { Banner, Card, Field, Spinner, Tag, ghostBtn, iconBtn, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';
import { LangCard } from '../../ui/LangPicker.jsx';
import { PrimaLogo } from '../../ui/PrimaLogo.jsx';
import { BRAND_ART, BuildingThumb, useBrandImage } from '../../ui/brand.jsx';

// Kroky: 'lang' → 'code' → ('public'). ?c=KÓD z QR na lístku predvyplní kód.
// Vstup do appky má rovnakú stavbu ako prihlásenie PRIMA TOOLS / RE SERVICE: oficiálne logo,
// izometrická ilustrácia všetkých budov, pod ňou karta s obsahom. Bez ilustrácie vínová hlavička.
export function Welcome({ query, initialStep, hasLang }) {
  const { t, lang, setLang, ready } = useT();
  const [step, setStep] = useState(initialStep || (hasLang ? 'code' : 'lang'));
  const [code, setCode] = useState(query.get('c') || '');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const art = useBrandImage(BRAND_ART);
  useEffect(() => { if (query.get('c')) setCode(query.get('c')); }, [query]);

  const submit = async () => {
    if (busy) return;
    setError('');
    if (!code.trim() || surname.trim().length < 3) { setError(t('welcome.invalid')); return; }
    setBusy(true);
    try { await Promise.resolve(redeemCode(code, surname)); navigate('/', { replace: true }); }
    catch (e) { setError(t('welcome.invalid')); }
    setBusy(false);
  };
  const demoHint = DEMO_MODE ? DEMO_STAYS.map(s => s.code).join(', ') : null;
  const demoSurname = DEMO_MODE ? DEMO_SURNAMES[String(code).toUpperCase().trim()] : null;
  const bigInput = { ...inputStyle, fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', minHeight: 60, textAlign: 'center' };
  const title = ready ? t('welcome.title') : 'Welcome to PRIMA';

  if (step === 'lang') {
    return (
      <div className="fade-in" style={{ minHeight: '100dvh' }}>
        {art ? (
          <div style={{ background: 'linear-gradient(180deg, #E9EDF2 0%, #F6F2EE 100%)', padding: '22px 20px 0', overflow: 'hidden' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <PrimaLogo variant="horizontal" tone="brand" height={46}/>
              <img src={BRAND_ART} alt="" style={{ display: 'block', width: '110%', maxWidth: 560, maxHeight: '36dvh', objectFit: 'contain', margin: '4px auto -6px', transform: 'translateX(-3%)' }}/>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', background: BRAND.wineGradient, color: '#fff', padding: '26px 24px 30px', borderRadius: '0 0 40px 40px', overflow: 'hidden', boxShadow: '0 22px 44px rgba(74,15,27,0.28)' }}>
            <PrimaLogo variant="roof" tone="white" height={150} style={{ position: 'absolute', right: -60, top: 60, opacity: 0.1 }}/>
            <PrimaLogo variant="horizontal" tone="white" height={44}/>
            <h1 style={{ margin: '48px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, maxWidth: 300 }}>{title}<br/><span style={{ fontWeight: 500, opacity: 0.85 }}>Welcome home.</span></h1>
          </div>
        )}
        <div className="page page-nonav" style={{ paddingTop: 18 }}>
          {art && <h1 style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{title} <span style={{ fontWeight: 500, color: C.textMuted }}>Welcome home.</span></h1>}
          <div style={{ fontSize: 14, color: C.textMuted, margin: art ? '10px 0 18px' : '0 0 16px', fontWeight: 600 }}>{t('welcome.chooseLanguage')} · Choose your language</div>
          <div className="lang-grid">
            {LANGS.map(l => <LangCard key={l.code} l={l} active={l.code === lang} onClick={() => { setLang(l.code); setStep('code'); }}/>)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page page-nonav fade-in" style={{ paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button type="button" style={iconBtn} onClick={() => setStep(step === 'public' ? 'code' : 'lang')} aria-label="back"><Icon name="ChevronLeft" size={22}/></button>
        <PrimaLogo variant="mark" tone="brand" height={26}/>
        <span style={{ flex: 1 }}/>
        <button type="button" style={{ ...iconBtn, width: 'auto', padding: '0 12px', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em' }} onClick={() => setStep('lang')}><Icon name="Languages" size={16}/>{lang.toUpperCase()}</button>
      </div>
      {step === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Tag tone="danger" icon="KeyRound" style={{ marginBottom: 14 }}>{t('welcome.code')}</Tag>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{t('welcome.codeTitle')}</h1>
            <div style={{ fontSize: 15, color: C.textMuted, marginTop: 10, lineHeight: 1.45 }}>{t('welcome.codeHint')}</div>
          </div>
          <Field label={t('welcome.code')}>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} inputMode="text" autoCapitalize="characters" autoComplete="one-time-code" placeholder="TARIF-2214" style={bigInput} onKeyDown={e => { if (e.key === 'Enter') submit(); }}/>
          </Field>
          <Field label={t('welcome.surname')}>
            <input value={surname} onChange={e => setSurname(e.target.value)} maxLength={3} autoCapitalize="characters" placeholder="ABC" style={{ ...bigInput, letterSpacing: '0.3em', maxWidth: 200 }} onKeyDown={e => { if (e.key === 'Enter') submit(); }}/>
          </Field>
          {error && <Banner tone="danger" icon="AlertCircle">{error}</Banner>}
          {demoHint && <Banner tone="info" icon="Info"><div>{t('welcome.demoCodes', { codes: demoHint })}</div>{demoSurname && <div style={{ marginTop: 4, fontWeight: 800 }}>{t('welcome.demoSurname', { surname: demoSurname })}</div>}</Banner>}
          <button type="button" style={primaryBtn} onClick={submit} disabled={busy}>{busy ? <Spinner/> : null}{t('welcome.signIn')}<Icon name="ChevronRight" size={20}/></button>
          <button type="button" style={{ ...ghostBtn, display: 'block', width: '100%', textAlign: 'center', color: C.textMuted, lineHeight: 1.45, whiteSpace: 'normal' }} onClick={() => setStep('public')}>{t('welcome.noCode')}<br/><span style={{ color: BRAND.red }}>{t('welcome.publicTitle')}</span></button>
        </div>
      )}
      {step === 'public' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{t('welcome.publicTitle')}</h1>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 8, lineHeight: 1.45 }}>{t('welcome.publicHint')}</div>
          </div>
          <Card className="rows" style={{ padding: '4px 18px' }}>
            {PROPERTIES.map(p => (
              <button key={p.id} type="button" className="row press" onClick={() => { setPublicProperty(p.id); navigate('/', { replace: true }); }} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: C.text, padding: '12px 0' }}>
                <BuildingThumb property={p} size={52} radius={16}/>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3 }}>{p.street}, {p.city}</span>
                </span>
                <Icon name="ChevronRight" size={20} color={C.textFaint}/>
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
