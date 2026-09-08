import { useEffect, useMemo, useState } from 'react';
import { C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { CARD_REASONS, DOC_PICKUPS, DOC_PURPOSES, ISSUE_BY_KEY, PLACES, SLOTS, URGENCY } from '../../config/catalog.js';
import { PRIVATE_CATEGORIES } from '../../config/catalog-v2.js';
import { useT } from '../../i18n/index.js';
import { cancelRequest, getRequest, subscribe } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { fmtDateTime } from '../../lib/format.js';
import { isOpen, statusMeta } from '../../domain/request-status.js';
import { roomLabel } from '../../domain/room-codes.js';
import { pickText } from '../../content/index.js';
import { Card, KeyValue, PageHeader, Sheet, StatusBadge, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';
import { requestIcon, requestTitle } from './Requests.jsx';

const label = (list, key, t) => { const x = list.find(i => i.key === key); return x ? t(x.t) : key; };

export function RequestDetail({ id }) {
  const { t, lang } = useT();
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const r = useMemo(() => getRequest(id), [id, tick]);
  if (!r) { navigate('/requests', { replace: true }); return null; }
  const cat = r.kind === 'issue' ? ISSUE_BY_KEY[r.category] : null;
  const canCancel = isOpen(r) && ['reported', 'assigned', 'forwarded'].includes(r.status);
  const timeline = r.timeline.slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  return (
    <>
      <PageHeader title={requestTitle(r, t)} sub={t('detail.ref') + ' ' + r.ref} onBack={() => back('/requests')} action={<StatusBadge status={r.status}/>}/>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ color: C.textMuted, display: 'flex' }}><Icon name={requestIcon(r)} size={22}/></span>
          <b style={{ fontSize: 15 }}>{t('requests.kind.' + r.kind)}</b>
        </div>
        {r.kind === 'issue' && <>
          <KeyValue label={t('detail.category')} value={t(cat.t)}/>
          <KeyValue label={t('detail.place')} value={r.place === 'room' ? t('place.myRoom') + ' ' + roomLabel(r.room) : label(PLACES, r.place, t) + (r.roomOther ? ' ' + r.roomOther : '')}/>
          <KeyValue label={t('report.urgency')} value={label(URGENCY, r.urgency, t)}/>
        </>}
        {r.kind === 'service' && <>
          {r.bags != null && <KeyValue label={t('svc.laundry.bags')} value={r.bags} mono/>}
          {r.slot && <KeyValue label={t('svc.when')} value={label(SLOTS, r.slot, t)}/>}
          {r.plate && <KeyValue label={t('svc.parking.plate')} value={r.plate} mono/>}
          {r.cardReason && <KeyValue label={t('svc.card.reason')} value={label(CARD_REASONS, r.cardReason, t)}/>}
          {r.roomReason && <KeyValue label={t('svc.room.reason')} value={r.roomReason}/>}
        </>}
        {r.kind === 'document' && <>
          <KeyValue label={t('docs.purpose')} value={label(DOC_PURPOSES, r.purpose, t)}/>
          <KeyValue label={t('docs.passport')} value={r.passport} mono/>
          {r.neededBy && <KeyValue label={t('docs.validUntil')} value={r.neededBy}/>}
          <KeyValue label={t('docs.pickup')} value={label(DOC_PICKUPS, r.pickup, t)}/>
        </>}
        {r.kind === 'private' && <>
          <KeyValue label={t('private.about')} value={label(PRIVATE_CATEGORIES, r.category, t)}/>
          <KeyValue label={t('private.anon')} value={r.anonymous ? t('common.yes') : t('common.no')}/>
        </>}
        {(r.text || r.note) && <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('detail.yourText')}</div>
          <div style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.text || r.note}</div>
        </div>}
        {r.photos && r.photos.length > 0 && <div className="photo-strip" style={{ marginTop: 12 }}>{r.photos.map((p, i) => <img key={i} src={p} alt=""/>)}</div>}
      </Card>

      <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 2px 10px' }}>{t('detail.timeline')}</div>
      <Card style={{ padding: '6px 16px' }}>
        {timeline.map((e, i) => {
          const m = statusMeta(e.status);
          const last = i === timeline.length - 1;
          const note = pickText(e.note, lang);
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : '1px solid ' + C.border }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: last ? C.success : C.borderStrong }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b style={{ fontSize: 15 }}>{t(m.t)}</b>
                  <span style={{ fontSize: 12, color: C.textFaint, fontFamily: monoFamily, whiteSpace: 'nowrap' }}>{fmtDateTime(e.at, lang)}</span>
                </div>
                {note && <div style={{ marginTop: 6, background: C.cardAlt, borderRadius: 8, padding: '8px 10px', fontSize: 14, lineHeight: 1.45 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{t('detail.staffNote')}</div>{note}
                </div>}
              </div>
            </div>
          );
        })}
      </Card>
      {canCancel && <button type="button" style={{ ...secondaryBtn, marginTop: 16, color: C.textMuted }} onClick={() => setConfirm(true)}><Icon name="Ban" size={16}/>{t('detail.cancel')}</button>}
      <Sheet open={confirm} title={t('detail.cancelConfirm')} onClose={() => setConfirm(false)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setConfirm(false)}>{t('common.no')}</button>
          <button type="button" style={{ ...primaryBtn, flex: 1 }} onClick={() => { cancelRequest(r.id); setConfirm(false); }}>{t('common.yes')}</button>
        </div>
      </Sheet>
    </>
  );
}
