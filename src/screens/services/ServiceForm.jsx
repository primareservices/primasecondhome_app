import { useState } from 'react';
import { C } from '../../config/theme.js';
import { CARD_REASONS, SERVICE_BY_KEY, SLOTS } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { createRequest } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { Banner, Card, Field, PageHeader, Segmented, Spinner, ghostBtn, inputStyle, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function ServiceForm({ type }) {
  const { t, lang } = useT();
  const { stay } = useApp();
  const svc = SERVICE_BY_KEY[type];
  const [bags, setBags] = useState(1);
  const [slot, setSlot] = useState('morning');
  const [note, setNote] = useState('');
  const [plate, setPlate] = useState('');
  const [cardReason, setCardReason] = useState('blocked');
  const [roomReason, setRoomReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  if (!svc) { navigate('/services', { replace: true }); return null; }
  const has = (f) => svc.fields.includes(f);

  const submit = () => {
    setError('');
    if (has('plate') && !plate.trim()) { setError(t('common.required') + ': ' + t('svc.parking.plate')); return; }
    if (has('roomReason') && !roomReason.trim()) { setError(t('common.required') + ': ' + t('svc.room.reason')); return; }
    if (svc.key === 'other' && !note.trim()) { setError(t('common.required') + ': ' + t('svc.note')); return; }
    setBusy(true);
    try {
      const req = createRequest(stay.id, { kind: 'service', service: svc.key, route: svc.route, lang,
        bags: has('bags') ? bags : undefined, slot: has('slot') ? slot : undefined, plate: has('plate') ? plate.trim() : undefined,
        cardReason: has('cardReason') ? cardReason : undefined, roomReason: has('roomReason') ? roomReason.trim() : undefined, note: note.trim() });
      setDone(req);
    } catch { setError(t('common.error')); }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', paddingTop: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.successSoft, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="CheckCircle2" size={40}/></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{t('svc.sentTitle')}</h1>
        <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.5, marginBottom: 16 }}>{t('svc.sentSub', { ref: done.ref })}</div>
        {svc.route === 'coordinator' && <Banner tone="info" icon="ArrowLeftRight" style={{ textAlign: 'left', marginBottom: 10 }}>{t('svc.room.note')}</Banner>}
        <button type="button" style={{ ...primaryBtn, marginTop: 8 }} onClick={() => navigate('/requests/' + done.id, { replace: true })}><Icon name="ClipboardList" size={18}/>{t('requests.title')}</button>
        <button type="button" style={{ ...ghostBtn, marginTop: 8 }} onClick={() => navigate('/', { replace: true })}>{t('nav.home')}</button>
      </div>
    );
  }
  return (
    <>
      <PageHeader title={t(svc.t)} sub={t(svc.sub)} onBack={() => back('/services')}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {svc.key === 'laundry' && <Banner tone="info" icon="Banknote">{t('svc.laundry.price', { price: svc.price })}</Banner>}
        {svc.key === 'card' && <Banner tone="warning" icon="KeyRound">{t('svc.card.note')}</Banner>}
        {svc.key === 'room' && <Banner tone="info" icon="ArrowLeftRight">{t('svc.room.note')}</Banner>}
        {has('bags') && (
          <Field label={t('svc.laundry.bags')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" style={{ ...secondaryBtn, width: 52, padding: 0 }} onClick={() => setBags(b => Math.max(1, b - 1))}>−</button>
              <b style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{bags}</b>
              <button type="button" style={{ ...secondaryBtn, width: 52, padding: 0 }} onClick={() => setBags(b => Math.min(5, b + 1))}>+</button>
            </div>
          </Field>
        )}
        {has('slot') && <Field label={t('svc.when')}><Segmented options={SLOTS.map(s => ({ key: s.key, label: t(s.t) }))} value={slot} onChange={setSlot}/></Field>}
        {has('plate') && <Field label={t('svc.parking.plate')}><input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="BA 123 AB" style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700 }}/></Field>}
        {has('cardReason') && <Field label={t('svc.card.reason')}><Segmented options={CARD_REASONS.map(r => ({ key: r.key, label: t(r.t) }))} value={cardReason} onChange={setCardReason}/></Field>}
        {has('roomReason') && <Field label={t('svc.room.reason')}><textarea value={roomReason} onChange={e => setRoomReason(e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84 }}/></Field>}
        {has('note') && <Field label={t('svc.note')} optional={svc.key !== 'other'}><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 72 }}/></Field>}
        {error && <Banner tone="danger" icon="AlertCircle">{error}</Banner>}
        <Card style={{ padding: 12, display: 'flex', gap: 10 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => back('/services')}>{t('common.cancel')}</button>
          <button type="button" style={{ ...primaryBtn, flex: 2 }} onClick={submit} disabled={busy}>{busy ? <Spinner/> : <Icon name="Send" size={18}/>}{t('svc.submit')}</button>
        </Card>
      </div>
    </>
  );
}
