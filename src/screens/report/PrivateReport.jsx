import { useRef, useState } from 'react';
import { C } from '../../config/theme.js';
import { NETWORK } from '../../config/app-config.js';
import { PRIVATE_CATEGORIES } from '../../config/catalog-v2.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { compressImage } from '../../lib/photo.js';
import { Banner, Card, Field, PageHeader, Segmented, Spinner, Toggle, ghostBtn, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

// Súkromné nahlásenie (poriadok, bod 12): ide vedeniu PRIMA, nie do ticketov údržby.
export function PrivateReport() {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [category, setCategory] = useState('guest');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [anonymous, setAnonymous] = useState(true);
  const [contact, setContact] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);
  const E = NETWORK.emergency;
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 2 - photos.length); e.target.value = '';
    for (const f of files) { try { const dataUrl = await compressImage(f); setPhotos(p => [...p, dataUrl]); } catch {} }
  };
  const submit = () => {
    setError('');
    if (text.trim().length < 5) { setError(t('private.needText')); return; }
    const req = createRequest(stay.id, { kind: 'private', category, text: text.trim(), photos, anonymous, contact: !anonymous && contact, lang });
    setDone(req);
  };
  if (done) return (
    <div className="fade-in" style={{ textAlign: 'center', paddingTop: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.successSoft, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="ShieldCheck" size={40}/></div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{t('private.sentTitle')}</h1>
      <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.5 }}>{t('private.sentSub')} · {t('detail.ref')} {done.ref}</div>
      <button type="button" style={{ ...primaryBtn, marginTop: 16 }} onClick={() => navigate('/requests/' + done.id, { replace: true })}><Icon name="ClipboardList" size={18}/>{t('requests.title')}</button>
      <button type="button" style={{ ...ghostBtn, marginTop: 8 }} onClick={() => navigate('/', { replace: true })}>{t('nav.home')}</button>
    </div>
  );
  return (
    <>
      <PageHeader title={t('private.title')} sub={t('private.sub')} onBack={() => back('/report')}/>
      <Banner tone="info" icon="ShieldCheck" style={{ marginBottom: 16 }}>{t('private.banner')}</Banner>
      <Field label={t('private.about')}><Segmented options={PRIVATE_CATEGORIES.map(c => ({ key: c.key, label: t(c.t) }))} value={category} onChange={setCategory}/></Field>
      <Field label={t('private.what')} style={{ marginTop: 16 }}><textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={t('private.whatPh')} style={{ ...inputStyle, minHeight: 100 }}/></Field>
      <Field label={t('private.photo')} optional style={{ marginTop: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles}/>
        <div className="photo-strip">
          {photos.map((p, i) => <div key={i} style={{ position: 'relative' }}><img src={p} alt=""/><button type="button" aria-label={t('common.remove')} onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="X" size={14}/></button></div>)}
          {photos.length < 2 && <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 84, height: 84, borderRadius: 10, border: '1px dashed ' + C.borderStrong, background: C.card, color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Icon name="Camera" size={22}/>{t('common.photo')}</button>}
        </div>
      </Field>
      <Card style={{ marginTop: 16, padding: '4px 16px' }}>
        <Toggle checked={anonymous} onChange={v => { setAnonymous(v); if (v) setContact(false); }} label={t('private.anon')} sub={t('private.anonSub')}/>
        <div style={{ borderTop: '1px solid ' + C.border }}/>
        <Toggle checked={contact && !anonymous} onChange={v => { setContact(v); if (v) setAnonymous(false); }} label={t('private.contact')} sub={t('private.contactSub')}/>
      </Card>
      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 12 }}>{error}</Banner>}
      <button type="button" style={{ ...primaryBtn, marginTop: 16 }} onClick={submit}><Icon name="Send" size={18}/>{t('private.submit')}</button>
      <Banner tone="danger" icon="Siren" style={{ marginTop: 12 }}>{t('private.danger', { a: E.general, b: E.police })}</Banner>
    </>
  );
}
