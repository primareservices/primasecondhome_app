import { useEffect, useState } from 'react';
import { C } from '../../config/theme.js';
import { APP_VERSION } from '../../config/app-config.js';
import { LANGS } from '../../config/languages.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { signRules } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { contentSync, loadContent } from '../../content/index.js';
import { hasPack, loadPack, packSync } from '../../content/packs/index.js';
import { renderSignedRules } from '../../lib/rules-doc.js';
import { bytesToDataUrl, sha256Hex } from '../../lib/pdf.js';
import { Banner, Card, Field, PageHeader, Spinner, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { SignaturePad } from '../../ui/SignaturePad.jsx';
import { Icon } from '../../ui/icons.jsx';
import { RulesBody } from './Rules.jsx';

// Check-in: 1) prečítať poriadok a potvrdiť, 2) podpísať prstom. Podpísané PDF (jazyk hosťa + slovensky,
// podpis, auditný blok) sa vyrobí hneď v telefóne a uloží do Dokumentov; server neskôr doplní
// textové PDF a pošle kópiu e-mailom (edge funkcia sign-rules).
export function RulesAck() {
  const { t, lang } = useT();
  const { stay, rules, property } = useApp();
  const [step, setStep] = useState('read');
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState(stay.displayName || '');
  const [email, setEmail] = useState(stay.email || '');
  const [png, setPng] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rulesSk, setRulesSk] = useState(() => (lang === 'sk' ? null : ((property && hasPack(property.id) && packSync(property.id, 'sk')) ? packSync(property.id, 'sk').rules : contentSync('sk').rules)));
  useEffect(() => {
    if (lang === 'sk') return;
    const p = property && hasPack(property.id) ? loadPack(property.id, 'sk').then(x => x && x.rules) : loadContent('sk').then(c => c && c.rules);
    p.then(r => { if (r) setRulesSk(r); }).catch(() => {});
  }, [lang, property]);

  const sign = async () => {
    setError('');
    if (!name.trim()) { setError(t('common.required') + ': ' + t('rules.signName')); return; }
    if (!png) { setError(t('rules.signNeed')); return; }
    setBusy(true);
    try {
      const signedAt = new Date().toISOString();
      const langName = (LANGS.find(l => l.code === lang) || {}).name || lang;
      const { pdf } = await renderSignedRules({ rulesGuest: rules, rulesSk, lang, langName, property, stay, name: name.trim(), signedAt, version: rules.version, signaturePng: png, appVersion: APP_VERSION, labels: { title: t('rules.docTitle'), legal: t('rules.docLegal') } });
      const sha256 = await sha256Hex(pdf);
      signRules(stay.id, { version: rules.version, name: name.trim(), email: email.trim() || null, lang, signaturePng: png, pdfDataUrl: bytesToDataUrl(pdf), sha256 });
      navigate('/', { replace: true });
    } catch (e) { setError(t('common.error')); }
    setBusy(false);
  };

  if (step === 'sign') {
    return (
      <div className="page page-nonav fade-in">
        <PageHeader title={t('rules.signTitle')} sub={t('rules.updated', { date: rules.version })} onBack={() => setStep('read')}/>
        <Banner tone="info" icon="FileSignature">{t('rules.signIntro')}</Banner>
        <Field label={t('rules.signName')} style={{ marginTop: 16 }}><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoComplete="name"/></Field>
        <Field label={t('rules.signEmail')} style={{ marginTop: 14 }}><input type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}/></Field>
        <Field label={t('rules.signPad')} style={{ marginTop: 14 }}><SignaturePad onChange={setPng}/></Field>
        {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 12 }}>{error}</Banner>}
        <button type="button" style={{ ...primaryBtn, marginTop: 16, opacity: png && name.trim() ? 1 : 0.55 }} disabled={busy} onClick={sign}>
          {busy ? <Spinner/> : <Icon name="PenLine" size={18}/>}{t('rules.signBtn')}
        </button>
      </div>
    );
  }
  return (
    <div className="page page-nonav fade-in">
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 4px' }}>{t('rules.ackTitle')}</h1>
      <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 14 }}>{t('rules.updated', { date: rules.version })}</div>
      <RulesBody rules={rules}/>
      <Card style={{ position: 'sticky', bottom: 12, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15, fontWeight: 600, minHeight: 44 }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 22, height: 22, accentColor: '#EE2A24' }}/>
          {t('rules.ack')}
        </label>
        <button type="button" style={{ ...primaryBtn, opacity: checked ? 1 : 0.5 }} disabled={!checked} onClick={() => { setStep('sign'); window.scrollTo(0, 0); }}>
          <Icon name="PenLine" size={18}/>{t('common.continue')}
        </button>
      </Card>
    </div>
  );
}
