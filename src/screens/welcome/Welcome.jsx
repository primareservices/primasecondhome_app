import { useEffect, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { APP_NAME, DEMO_MODE } from '../../config/app-config.js';
import { PROPERTIES } from '../../config/properties.js';
import { LANGS } from '../../config/languages.js';
import { useT } from '../../i18n/index.js';
import { navigate } from '../../router.js';
import { redeemCode, setPublicProperty } from '../../data/adapter.js';
import { DEMO_STAYS, DEMO_SURNAMES } from '../../data/seed.js';
import { BrandMark } from '../../shell/index.jsx';
import { Banner, Field, ListRow, Spinner, Tag, ghostBtn, iconBtn, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';
import { LangCard } from '../../ui/LangPicker.jsx';

// Kroky: 'lang' → 'code' → ('public'). ?c=KÓD z QR na lístku predvyplní kód.
export function Welcome({ query, initialStep, hasLang }) {
  const { t, lang, setLang, ready } = useT();
  const [step, setStep] = useState(initialStep || (hasLang ? 'code' : 'lang'));
  const [code, setCode] = useState(query.get('c') || '');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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

  if (step === 'lang') {
    return (
      <div className="fade-in" style={{ minHeight: '100dvh' }}>
        <div style={{ position: 'relative', background: BRAND.wineGradient, color: '#fff', padding: '26px 24px 30px', borderRadius: '0 0 40px 40px', overflow: 'hidden', boxShadow: '0 22px 44px rgba(74,15,27,0.28)' }}>
          <svg width="300" height="300" viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', right: -70, top: 40, opacity: 0.1 }}><path d="M50 24 L18 50 H27 V78 H44 V60 H56 V78 H73 V50 H82 Z" fill="#fff"/><rect x="62" y="28" width="7" height="14" fill="#fff"/></svg>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><BrandMark size={40} white/><b style={{ fontSize: 13, letterSpacing: '0.12em' }}>{APP_NAME}</b></div>
          <h1 style={{ margin: '56px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, maxWidth: 300 }}>{ready ? t('welcome.title') : 'Welcome to PRIMA'}<br/><span style={{ fontWeight: 500, opacity: 0.85 }}>Welcome home.</span></h1>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 10 }}>{t('welcome.chooseLanguage')} · Choose your language</div>
        </div>
        <div className="page page-nonav" style={{ paddingTop: 18 }}>
          <div className="lang-grid">
            {LANGS.map(l => <LangCard key={l.code} l={l} active={l.code === lang} onClick={() => { setLang(l.code); setStep('code'); }}/>)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="page page-nonav fade-in" style={{ paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
        <button type="button" style={iconBtn} onClick={() => setStep(step === 'public' ? 'code' : 'lang')} aria-label="back"><Icon name="ChevronLeft" size={22}/></button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{t('welcome.publicTitle')}</h1>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 8, lineHeight: 1.45 }}>{t('welcome.publicHint')}</div>
          </div>
          {PROPERTIES.map(p => <ListRow key={p.id} icon="Building2" title={p.name} sub={p.street + ', ' + p.city} onClick={() => { setPublicProperty(p.id); navigate('/', { replace: true }); }}/>)}
        </div>
      )}
    </div>
  );
}
