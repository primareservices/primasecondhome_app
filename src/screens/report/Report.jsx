import { useRef, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { ISSUE_BY_KEY, ISSUE_CATEGORIES, PLACES, URGENCY } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { compressImage } from '../../lib/photo.js';
import { roomLabel } from '../../domain/room-codes.js';
import { Banner, Card, Chip, Field, ListRow, PageHeader, Segmented, Spinner, ghostBtn, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function Report({ query }) {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [category, setCategory] = useState(query.get('cat') || '');
  const [place, setPlace] = useState('room');
  const [roomOther, setRoomOther] = useState('');
  const [photos, setPhotos] = useState([]);
  const [text, setText] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    e.target.value = '';
    for (const f of files) { try { setPhotos(p => [...p, { dataUrl: null, loading: true }]); const dataUrl = await compressImage(f); setPhotos(p => { const n = p.slice(); const i = n.findIndex(x => x.loading); if (i >= 0) n[i] = { dataUrl }; return n; }); } catch { setPhotos(p => p.filter(x => !x.loading)); } }
  };
  const submit = async () => {
    setError('');
    if (!category) { setError(t('report.needCategory')); return; }
    if (place !== 'room' && place !== 'kitchen' && place !== 'bathroom' && place !== 'laundry' && !roomOther.trim() && place === 'other') { setError(t('report.needPlace')); return; }
    setBusy(true);
    try {
      const req = createRequest(stay.id, { kind: 'issue', category, place, room: place === 'room' ? stay.room : null, roomOther: roomOther.trim(), urgency, text: text.trim(), lang, photos: photos.filter(p => p.dataUrl).map(p => p.dataUrl) });
      setDone(req);
    } catch { setError(t('common.error')); }
    setBusy(false);
  };
  const cat = ISSUE_BY_KEY[category];

  if (done) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', paddingTop: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.successSoft, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="CheckCircle2" size={40}/></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{t('report.sentTitle')}</h1>
        <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.5, marginBottom: 16 }}>{t('report.sentSub', { ref: done.ref })}</div>
        {cat && cat.ddd && <Banner tone="warning" icon="Bug" style={{ textAlign: 'left', marginBottom: 10 }}>{t('report.pestsNote')}</Banner>}
        {cat && cat.reception && <Banner tone="info" icon="Headset" style={{ textAlign: 'left', marginBottom: 10 }}>{t('report.noiseNote')}</Banner>}
        <button type="button" style={{ ...primaryBtn, marginTop: 8 }} onClick={() => navigate('/requests/' + done.id, { replace: true })}><Icon name="ClipboardList" size={18}/>{t('requests.title')}</button>
        <button type="button" style={{ ...ghostBtn, marginTop: 8 }} onClick={() => navigate('/', { replace: true })}>{t('nav.home')}</button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('report.title')} onBack={() => back('/')}/>
      <Field label={t('report.what')}>
        <div className="grid-cats">
          {ISSUE_CATEGORIES.map(c => {
            const active = c.key === category;
            return (
              <button key={c.key} type="button" onClick={() => setCategory(c.key)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '10px 12px', minHeight: 72, textAlign: 'left', borderRadius: C.radiusSm,
                border: '1px solid ' + (active ? BRAND.red : C.borderStrong), background: active ? BRAND.redSoft : C.card, color: C.text,
              }}>
                <span style={{ color: active ? BRAND.red : C.textMuted, display: 'flex' }}><Icon name={c.icon} size={22}/></span>
                <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.25 }}>{t(c.t)}</span>
              </button>
            );
          })}
        </div>
      </Field>
      {cat && cat.reception && <Banner tone="info" icon="Headset" style={{ marginTop: 10 }}>{t('report.noiseNote')}</Banner>}
      {cat && cat.ddd && <Banner tone="warning" icon="Bug" style={{ marginTop: 10 }}>{t('report.pestsNote')}</Banner>}
      <div style={{ marginTop: 12 }}><ListRow icon="ShieldCheck" title={t('report.private')} sub={t('report.privateSub')} onClick={() => navigate('/private')}/></div>

      <Field label={t('report.where')} hint={t('report.roomHint')} style={{ marginTop: 18 }}>
        <div className="chips">
          {PLACES.map(p => <Chip key={p.key} active={place === p.key} onClick={() => setPlace(p.key)}>{p.key === 'room' ? t(p.t) + ' ' + roomLabel(stay.room) : t(p.t)}</Chip>)}
        </div>
        {place !== 'room' && <input value={roomOther} onChange={e => setRoomOther(e.target.value)} placeholder={t('report.roomOther')} style={inputStyle}/>}
      </Field>

      <Field label={t('report.photo')} hint={t('report.photoHint')} optional style={{ marginTop: 18 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onFiles}/>
        <div className="photo-strip">
          {photos.map((p, i) => p.loading ? <div key={i} style={{ width: 84, height: 84, borderRadius: 10, background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner/></div> : (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p.dataUrl} alt=""/>
              <button type="button" aria-label={t('common.remove')} onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="X" size={14}/></button>
            </div>
          ))}
          {photos.length < 3 && <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 84, height: 84, borderRadius: 10, border: '1px dashed ' + C.borderStrong, background: C.card, color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Icon name="Camera" size={22}/>{t('common.photo')}</button>}
        </div>
      </Field>

      <Field label={t('report.describe')} optional style={{ marginTop: 18 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={t('report.describePh')} style={{ ...inputStyle, minHeight: 84 }}/>
      </Field>

      <Field label={t('report.urgency')} style={{ marginTop: 18 }}>
        <Segmented options={URGENCY.map(u => ({ key: u.key, label: t(u.t) }))} value={urgency} onChange={setUrgency}/>
      </Field>

      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 14 }}>{error}</Banner>}
      <Card style={{ marginTop: 18, padding: 12, display: 'flex', gap: 10 }}>
        <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => back('/')}>{t('common.cancel')}</button>
        <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={submit} disabled={busy}>{busy ? <Spinner/> : <Icon name="Send" size={18}/>}{t('report.submit')}</button>
      </Card>
    </>
  );
}
