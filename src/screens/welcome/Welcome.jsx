import { useEffect, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { APP_NAME, DEMO_MODE } from '../../config/app-config.js';
import { PROPERTIES } from '../../config/properties.js';
import { useT } from '../../i18n/index.js';
import { navigate } from '../../router.js';
import { redeemCode, setPublicProperty } from '../../data/adapter.js';
import { DEMO_STAYS, DEMO_SURNAMES } from '../../data/seed.js';
import { PrimaLogo } from '../../ui/PrimaLogo.jsx';
import { LangPicker } from '../../ui/LangPicker.jsx';
import { Banner, Card, Field, ListRow, Spinner, ghostBtn, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

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
    try {
      await Promise.resolve(redeemCode(code, surname));
      navigate('/', { replace: true });
    } catch (e) { setError(t('welcome.invalid')); }
    setBusy(false);
  };
  const demoHint = DEMO_MODE ? DEMO_STAYS.map(s => s.code).join(', ') : null;
  const demoSurname = DEMO_MODE ? DEMO_SURNAMES[String(code).toUpperCase().trim()] : null;

  return (
    <div className="page page-nonav fade-in" style={{ paddingTop: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 22, textAlign: 'center' }}>
        <PrimaLogo size={56} wordmark={false}/>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: BRAND.red }}>{APP_NAME}</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{ready ? t('welcome.title') : 'Welcome to PRIMA'}</h1>
      </div>

      {step === 'lang' && (
        <>
          <div style={{ fontSize: 15, color: C.textMuted, textAlign: 'center', marginBottom: 14 }}>{t('welcome.chooseLanguage')} · Choose your language</div>
          <LangPicker value={lang} onChange={(code) => { setLang(code); setStep('code'); }}/>
        </>
      )}

      {step === 'code' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!ready && <Spinner/>}
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{t('welcome.codeTitle')}</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>{t('welcome.codeHint')}</div>
          </div>
          <Field label={t('welcome.code')}>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} inputMode="text" autoCapitalize="characters" autoComplete="one-time-code"
              placeholder="IC23-1102" style={{ ...inputStyle, letterSpacing: '0.08em', fontWeight: 700, fontSize: 18 }} onKeyDown={e => { if (e.key === 'Enter') submit(); }}/>
          </Field>
          <Field label={t('welcome.surname')}>
            <input value={surname} onChange={e => setSurname(e.target.value)} maxLength={3} autoCapitalize="characters" placeholder="ABC"
              style={{ ...inputStyle, letterSpacing: '0.12em', fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }} onKeyDown={e => { if (e.key === 'Enter') submit(); }}/>
          </Field>
          {error && <Banner tone="danger" icon="AlertCircle">{error}</Banner>}
          {demoHint && (
            <Banner tone="info" icon="Info">
              <div>{t('welcome.demoCodes', { codes: demoHint })}</div>
              {demoSurname && <div style={{ marginTop: 4, fontWeight: 700 }}>{t('welcome.demoSurname', { surname: demoSurname })}</div>}
            </Banner>
          )}
          <button type="button" style={primaryBtn} onClick={submit} disabled={busy}>{busy ? <Spinner/> : <Icon name="KeyRound" size={18}/>}{t('welcome.signIn')}</button>
          <button type="button" style={{ ...ghostBtn, alignSelf: 'center' }} onClick={() => setStep('public')}>{t('welcome.noCode')}<Icon name="ChevronRight" size={16}/></button>
          <button type="button" style={{ ...ghostBtn, alignSelf: 'center', fontSize: 13 }} onClick={() => setStep('lang')}><Icon name="Languages" size={15}/>{t('profile.language')}</button>
        </Card>
      )}

      {step === 'public' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{t('welcome.publicTitle')}</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>{t('welcome.publicHint')}</div>
          </div>
          {PROPERTIES.map(p => (
            <ListRow key={p.id} icon="Building2" title={p.name} sub={p.street + ', ' + p.city} onClick={() => { setPublicProperty(p.id); navigate('/', { replace: true }); }}/>
          ))}
          <button type="button" style={{ ...ghostBtn, alignSelf: 'center' }} onClick={() => setStep('code')}><Icon name="ChevronLeft" size={16}/>{t('welcome.codeTitle')}</button>
        </div>
      )}
    </div>
  );
}
