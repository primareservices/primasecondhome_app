import { useEffect, useRef, useState } from 'react';
import { C } from '../../config/theme.js';
import { shadow } from '../../config/app-config.js';
import { ISSUE_BY_KEY, ISSUE_CATEGORIES, PLACES, URGENCY } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { compressImage } from '../../lib/photo.js';
import { describeRoom, normalizeRoomCode, roomLabel } from '../../domain/room-codes.js';
import { clearQrPending, peekQrPending } from '../../boot/deep-link.js';
import { DictateButton, Tag, Banner, Chip, Field, IconBox, ListRow, PageHeader, Segmented, Spinner, ghostBtn, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const addTile = { width: 84, height: 84, borderRadius: 14, border: 'none', background: C.card, boxShadow: 'inset 0 0 0 1.5px ' + C.borderStrong, color: C.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600 };

// Potvrdenie ručne zadaného kódu izby: 111/2 → „Bunka 111 · izba 2 · 1. poschodie“, B214 → „Blok B · 2. poschodie“.
function roomHint(info, t) {
  const parts = [];
  if (info.cell) parts.push(info.sub ? t('report.roomParsedCell', { cell: info.cell, sub: info.sub }) : t('report.roomParsedCellOnly', { cell: info.cell }));
  if (info.block) parts.push(t('report.roomParsedBlock', { block: info.block }));
  if (info.floor !== null && info.floor !== undefined) parts.push(info.floor === '0' ? t('report.roomParsedGround') : t('report.roomParsedFloor', { floor: info.floor }));
  return parts.join(' · ');
}

export function Report({ query }) {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [category, setCategory] = useState(query.get('cat') || '');
  // QR štítok na dverách (?qr=IC23:111/2): ak mieri na inú izbu než hosťovu, predvyplní ju.
  const [qrRoom] = useState(() => { const q = peekQrPending(); const r = q && q.room ? normalizeRoomCode(q.room) : ''; return r && r !== normalizeRoomCode(stay.room) ? r : ''; });
  useEffect(() => { clearQrPending(); }, []);
  const [place, setPlace] = useState(qrRoom ? 'other' : 'room');
  const [roomOther, setRoomOther] = useState(qrRoom);
  const [photos, setPhotos] = useState([]);
  const [text, setText] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);
  const roomInfo = place !== 'room' ? describeRoom(normalizeRoomCode(roomOther)) : null;

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    e.target.value = '';
    for (const f of files) { try { setPhotos(p => [...p, { dataUrl: null, loading: true }]); const dataUrl = await compressImage(f); setPhotos(p => { const n = p.slice(); const i = n.findIndex(x => x.loading); if (i >= 0) n[i] = { dataUrl }; return n; }); } catch { setPhotos(p => p.filter(x => !x.loading)); } }
  };
  const submit = async () => {
    setError('');
    if (!category) { setError(t('report.needCategory')); return; }
    if (place === 'other' && !roomOther.trim()) { setError(t('report.needPlace')); return; }
    setBusy(true);
    try {
      const req = createRequest(stay.id, { kind: 'issue', category, place, room: place === 'room' ? stay.room : null, roomOther: roomInfo ? normalizeRoomCode(roomOther) : roomOther.trim(), roomCode: roomInfo ? normalizeRoomCode(roomOther) : null, urgency, text: text.trim(), lang, photos: photos.filter(p => p.dataUrl).map(p => p.dataUrl) });
      setDone(req);
    } catch { setError(t('common.error')); }
    setBusy(false);
  };
  const cat = ISSUE_BY_KEY[category];

  if (done) {
    const queued = done.sync === 'queued';
    return (
      <div className="fade-in" style={{ textAlign: 'center', paddingTop: 32 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', boxShadow: 'inset 0 0 0 1.5px ' + (queued ? C.warningBorder : C.successBorder), color: queued ? C.warning : C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Icon name={queued ? 'CloudOff' : 'CheckCircle2'} size={40}/></div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>{queued ? t('offline.queuedTitle') : t('report.sentTitle')}</h1>
        <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.5, marginBottom: 18 }}>{queued ? t('offline.queuedSub') : t('report.sentSub', { ref: done.ref })}</div>
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
            const on = c.key === category;
            return (
              <button key={c.key} type="button" className={'opt press' + (on ? ' on' : '')} onClick={() => setCategory(c.key)} aria-pressed={on} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '12px 12px', minHeight: 96 }}>
                <IconBox name={c.icon} tone={on ? 'brand' : 'default'} size={40} iconSize={20} radius={14}/>
                <span style={{ fontSize: 13.5, lineHeight: 1.25 }}>{t(c.t)}</span>
              </button>
            );
          })}
        </div>
      </Field>
      {cat && cat.reception && <Banner tone="info" icon="Headset" style={{ marginTop: 12 }}>{t('report.noiseNote')}</Banner>}
      {cat && cat.ddd && <Banner tone="warning" icon="Bug" style={{ marginTop: 12 }}>{t('report.pestsNote')}</Banner>}
      <div style={{ marginTop: 12 }}><ListRow icon="ShieldCheck" title={t('report.private')} sub={t('report.privateSub')} onClick={() => navigate('/private')}/></div>

      <Field label={t('report.where')} hint={t('report.roomHint')} style={{ marginTop: 22 }}>
        <div className="chips">
          {PLACES.map(p => <Chip key={p.key} active={place === p.key} onClick={() => setPlace(p.key)}>{p.key === 'room' ? t(p.t) + ' ' + roomLabel(stay.room) : t(p.t)}</Chip>)}
        </div>
        {place !== 'room' && <>
          <input value={roomOther} onChange={e => setRoomOther(e.target.value)} onBlur={() => setRoomOther(v => (describeRoom(normalizeRoomCode(v)) ? normalizeRoomCode(v) : v))} placeholder={t('report.roomOther')} style={inputStyle}/>
          {roomInfo && <div className="hint" style={{ marginTop: 6 }}>{roomHint(roomInfo, t)}</div>}
          {qrRoom && roomOther === qrRoom && <div style={{ marginTop: 8 }}><Tag tone="muted" icon="MapPin">{t('report.fromQr')}</Tag></div>}
        </>}
      </Field>

      <Field label={t('report.photo')} hint={t('report.photoHint')} optional style={{ marginTop: 22 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onFiles}/>
        <div className="photo-strip">
          {photos.map((p, i) => p.loading ? <div key={i} style={{ width: 84, height: 84, borderRadius: 14, boxShadow: shadow.sm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner/></div> : (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p.dataUrl} alt=""/>
              <button type="button" aria-label={t('common.remove')} onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="X" size={14}/></button>
            </div>
          ))}
          {photos.length < 3 && <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={addTile}><Icon name="Camera" size={22}/>{t('common.photo')}</button>}
        </div>
      </Field>

      <Field label={t('report.describe')} optional style={{ marginTop: 22 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={t('report.describePh')} style={{ ...inputStyle, minHeight: 90 }}/>
        <DictateButton lang={lang} onText={(s) => setText(v => (v ? v.replace(/\s+$/, '') + ' ' : '') + s)} label={t('common.dictate')} listeningLabel={t('common.listening')} style={{ marginTop: 8 }}/>
      </Field>

      <Field label={t('report.urgency')} style={{ marginTop: 22 }}>
        <Segmented options={URGENCY.map(u => ({ key: u.key, label: t(u.t) }))} value={urgency} onChange={setUrgency}/>
      </Field>

      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 14 }}>{error}</Banner>}
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => back('/')}>{t('common.cancel')}</button>
        <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={submit} disabled={busy}>{busy ? <Spinner/> : <Icon name="Send" size={18}/>}{t('report.submit')}</button>
      </div>
    </>
  );
}
