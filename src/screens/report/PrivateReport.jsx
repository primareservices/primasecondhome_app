import { useRef, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { NETWORK } from '../../config/app-config.js';
import { PRIVATE_CATEGORIES } from '../../config/catalog-v2.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { compressImage } from '../../lib/photo.js';
import { Banner, Card, Field, IconBox, PageHeader, Tag, Toggle, ghostBtn, inkBtn, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const CAT_ICON = { guest: 'Users', staff: 'Headset', safety: 'ShieldCheck', other: 'Info' };

// Súkromné nahlásenie (poriadok, bod 12): ide vedeniu PRIMA, nie do ticketov údržby.
// Smer A: 2×2 karty kategórií, čierne tlačidlo (nie červené — nie je to bežný ticket).
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
    <div className="fade-in" style={{ textAlign: 'center', paddingTop: 32 }}>
      <div style={{ width: 84, height: 84, borderRadius: 28, background: C.successSoft, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Icon name="ShieldCheck" size={40}/></div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>{t('private.sentTitle')}</h1>
      <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.5 }}>{t('private.sentSub')}<br/>{t('detail.ref')} <b className="num" style={{ color: C.text }}>{done.ref}</b></div>
      <button type="button" style={{ ...inkBtn, marginTop: 22 }} onClick={() => navigate('/requests/' + done.id, { replace: true })}><Icon name="ClipboardList" size={18}/>{t('requests.title')}</button>
      <button type="button" style={{ ...ghostBtn, marginTop: 8 }} onClick={() => navigate('/', { replace: true })}>{t('nav.home')}</button>
    </div>
  );
  return (
    <>
      <PageHeader title={t('private.title')} sub={t('private.sub') + ' ' + t('private.banner')} onBack={() => back('/report')}
        action={anonymous ? <Tag tone="ink" icon="EyeOff" style={{ height: 32, padding: '0 12px' }}>{t('private.anonTag')}</Tag> : null}/>
      <Field label={t('private.about')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {PRIVATE_CATEGORIES.map(c => {
            const on = c.key === category;
            return (
              <button key={c.key} type="button" className={'opt press' + (on ? ' on' : '')} onClick={() => setCategory(c.key)} aria-pressed={on} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 14 }}>
                <IconBox name={CAT_ICON[c.key] || 'Info'} tone={on ? 'brand' : 'default'} size={40} iconSize={20} radius={14}/>
                <span style={{ fontSize: 14, lineHeight: 1.25 }}>{t(c.t)}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={t('private.what')} style={{ marginTop: 18 }}><textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={t('private.whatPh')} style={{ ...inputStyle, minHeight: 120 }}/></Field>
      <Field label={t('private.photo')} optional style={{ marginTop: 18 }}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles}/>
        <div className="photo-strip">
          {photos.map((p, i) => <div key={i} style={{ position: 'relative' }}><img src={p} alt=""/><button type="button" aria-label={t('common.remove')} onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="X" size={14}/></button></div>)}
          {photos.length < 2 && <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 84, height: 84, borderRadius: 16, border: 'none', background: C.card, boxShadow: 'inset 0 0 0 1.5px rgba(23,22,26,0.08)', color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 800 }}><Icon name="Camera" size={22}/>{t('common.photo')}</button>}
        </div>
      </Field>
      <Card className="rows" style={{ marginTop: 18, padding: '4px 18px' }}>
        <Toggle checked={anonymous} onChange={v => { setAnonymous(v); if (v) setContact(false); }} label={t('private.anon')} sub={t('private.anonSub')}/>
        <Toggle checked={contact && !anonymous} onChange={v => { setContact(v); if (v) setAnonymous(false); }} label={t('private.contact')} sub={t('private.contactSub')}/>
      </Card>
      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 12 }}>{error}</Banner>}
      <button type="button" style={{ ...inkBtn, marginTop: 18 }} onClick={submit}><Icon name="Send" size={20}/>{t('private.submit')}</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '12px 14px', borderRadius: 16, background: BRAND.redSoft, color: BRAND.redDark, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
        <Icon name="Siren" size={18} style={{ flexShrink: 0 }}/><span>{t('private.danger', { a: E.general, b: E.police })}</span>
      </div>
    </>
  );
}
