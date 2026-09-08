import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { monoFamily } from '../../config/app-config.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { cancelBooking, createBooking, listBookings, subscribe } from '../../data/adapter.js';
import { back } from '../../router.js';
import { availability, canCancel, dayISO, nextDays, slotLabel } from '../../domain/laundry.js';
import { fmtDate } from '../../lib/format.js';
import { Banner, Card, Chip, EmptyState, Field, ListRow, PageHeader, SectionLabel, Sheet, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const DEFAULT_LAUNDRY = { slotHours: 2, machines: 4, hours: [7, 23], price: '2,30 €', location: null };

export function Laundry() {
  const { t, lang } = useT();
  const { stay, pack } = useApp();
  const facts = { laundry: { ...DEFAULT_LAUNDRY, ...((pack && pack.facts && pack.facts.laundry) || {}) } };
  const L = facts.laundry;
  const days = useMemo(() => nextDays(7), []);
  const [day, setDay] = useState(days[0]);
  const [sel, setSel] = useState(null);
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const bookings = useMemo(() => listBookings(stay.id), [stay, tick]);
  const slots = useMemo(() => availability(facts, day, bookings), [day, bookings]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = bookings.filter(b => b.status !== 'cancelled' && (b.day > dayISO(new Date()) || (b.day === dayISO(new Date()) && new Date().getHours() < b.start + (b.len || 2))));

  const book = () => {
    if (!sel) { setError(t('laundry.pick')); return; }
    setError('');
    try { const b = createBooking(stay.id, { day, start: sel.start, len: L.slotHours, machine: sel.machine }); setDone(b); setSel(null); }
    catch { setError(t('laundry.full')); }
  };
  const dayLabel = (iso, i) => (i === 0 ? t('common.today') + ' · ' : '') + new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'sk' ? 'sk-SK' : undefined, { weekday: 'short', day: 'numeric' });

  return (
    <>
      <PageHeader title={t('laundry.title')} sub={t('laundry.sub', { price: L.price, hours: L.slotHours })} onBack={() => back('/services')}/>
      <Banner tone="info" icon="Info" style={{ marginBottom: 14 }}>
        {t('laundry.info', { machines: L.machines })} {L.location ? L.location : <span style={{ color: C.textMuted }}>· {t('info.notSet')}</span>}
      </Banner>
      {done && <Banner tone="success" icon="CheckCircle2" style={{ marginBottom: 14 }}><b>{t('laundry.booked')}</b> · {fmtDate(done.day, lang)} · {slotLabel(done.start, done.len)} · {t('laundry.machine', { n: done.machine })}<div style={{ fontSize: 13, marginTop: 2 }}>{t('laundry.fee', { price: L.price })}</div></Banner>}

      <Field label={t('laundry.day')}>
        <div className="chips">{days.map((d, i) => <Chip key={d} active={d === day} onClick={() => { setDay(d); setSel(null); }}>{dayLabel(d, i)}</Chip>)}</div>
      </Field>

      <Field label={t('laundry.slots')} style={{ marginTop: 16 }}>
        <Card style={{ padding: '4px 16px' }}>
          {slots.map((s, i) => (
            <div key={s.start} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i === slots.length - 1 ? 'none' : '1px solid ' + C.border, opacity: s.past ? 0.45 : 1 }}>
              <span style={{ width: 92, fontSize: 14, fontWeight: 600, fontFamily: monoFamily, color: s.past ? C.textFaint : C.text }}>{s.label}</span>
              <span style={{ display: 'flex', gap: 6, flex: 1 }}>
                {s.machines.map(m => {
                  const isSel = sel && sel.start === s.start && sel.machine === m.n;
                  const disabled = s.past || m.taken;
                  return (
                    <button key={m.n} type="button" disabled={disabled} onClick={() => setSel({ start: s.start, machine: m.n })} aria-label={t('laundry.machine', { n: m.n })} style={{
                      width: 44, height: 36, borderRadius: 999, fontSize: 14, fontWeight: 700,
                      border: '1px solid ' + (isSel ? BRAND.red : m.mine ? C.successBorder : disabled ? C.border : C.borderStrong),
                      background: isSel ? BRAND.red : m.mine ? C.successSoft : disabled ? C.cardAlt : C.card,
                      color: isSel ? '#fff' : m.mine ? C.successText : disabled ? C.textFaint : C.text,
                    }}>{m.mine ? <Icon name="Check" size={16}/> : m.n}</button>
                  );
                })}
              </span>
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.45 }}>{t('laundry.legend')}</div>
      </Field>

      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 12 }}>{error}</Banner>}
      <Card style={{ marginTop: 14, borderColor: sel ? BRAND.red : C.border, background: sel ? BRAND.redSoft : C.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: sel ? BRAND.red : C.cardAlt, color: sel ? '#fff' : C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="WashingMachine" size={19}/></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{sel ? fmtDate(day, lang) + ' · ' + slotLabel(sel.start, L.slotHours) + ' · ' + t('laundry.machine', { n: sel.machine }) : t('laundry.pick')}</span>
            <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 2 }}>{t('laundry.fee', { price: L.price })}</span>
          </span>
        </div>
        <button type="button" style={{ ...primaryBtn, marginTop: 12, opacity: sel ? 1 : 0.5 }} onClick={book} disabled={!sel}><Icon name="Calendar" size={18}/>{t('laundry.book')}</button>
      </Card>

      <SectionLabel>{t('laundry.mine')}</SectionLabel>
      {active.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map(b => <ListRow key={b.id} icon="Clock" tone="info" title={fmtDate(b.day, lang) + ' · ' + slotLabel(b.start, b.len || 2) + ' · ' + t('laundry.machine', { n: b.machine })} sub={t('laundry.reminder')}
            right={canCancel(b) ? <button type="button" style={{ ...secondaryBtn, width: 'auto', minHeight: 40, padding: '8px 12px', fontSize: 13 }} onClick={() => setConfirm(b.id)}>{t('laundry.cancel')}</button> : null}/>)}
        </div>
      ) : <EmptyState icon="WashingMachine" title={t('laundry.none')}/>}
      <Sheet open={!!confirm} title={t('laundry.cancelConfirm')} onClose={() => setConfirm(null)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setConfirm(null)}>{t('common.no')}</button>
          <button type="button" style={{ ...primaryBtn, flex: 1 }} onClick={() => { cancelBooking(confirm); setConfirm(null); }}>{t('common.yes')}</button>
        </div>
      </Sheet>
    </>
  );
}
