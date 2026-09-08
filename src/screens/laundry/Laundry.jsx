import { useEffect, useMemo, useState } from 'react';
import { BRAND, C } from '../../config/theme.js';
import { localeOf } from '../../config/languages.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { cancelBooking, createBooking, listBookings, subscribe } from '../../data/adapter.js';
import { back } from '../../router.js';
import { availability, canCancel, dayISO, nextDays, slotLabel } from '../../domain/laundry.js';
import { fmtDate } from '../../lib/format.js';
import { Banner, Card, EmptyState, IconBox, PageHeader, SectionLabel, Sheet, Tag, primaryBtn, secondaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

const DEFAULT_LAUNDRY = { slotHours: 2, machines: 4, hours: [7, 23], price: '2,30 €', location: null };

// Práčovňa (smer A): dni ako vysoké pilulky, mriežka práčok — šrafované = obsadené,
// tyrkysové = moja, červené = vybrané. Súhrn s cenou pláva nad navigáciou.
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
  const now = new Date();
  const active = bookings.filter(b => b.status !== 'cancelled' && (b.day > dayISO(now) || (b.day === dayISO(now) && now.getHours() < b.start + (b.len || 2))));
  const locale = localeOf(lang);
  const dayParts = (iso) => { const d = new Date(iso + 'T12:00:00'); return [d.toLocaleDateString(locale, { weekday: 'short' }).replace(/\.$/, ''), d.getDate()]; };
  const grid = { display: 'grid', gridTemplateColumns: `repeat(${L.machines}, 44px)`, gap: 8 };

  const book = () => {
    if (!sel) { setError(t('laundry.pick')); return; }
    setError('');
    try { const b = createBooking(stay.id, { day, start: sel.start, len: L.slotHours, machine: sel.machine }); setDone(b); setSel(null); }
    catch { setError(t('laundry.full')); }
  };

  return (
    <>
      <PageHeader title={t('laundry.title')} sub={t('laundry.info', { machines: L.machines }) + (L.location ? ' ' + L.location : '')} onBack={() => back('/services')}
        action={<Tag tone="muted" style={{ height: 32, padding: '0 12px' }}><span className="num">{L.price} / {L.slotHours} h</span></Tag>}/>
      {done && <Banner tone="success" icon="CheckCircle2" style={{ marginBottom: 16 }}><b>{t('laundry.booked')}</b> · {fmtDate(done.day, lang)} · {slotLabel(done.start, done.len)} · {t('laundry.machine', { n: done.machine })}<div style={{ fontSize: 13, marginTop: 2 }}>{t('laundry.fee', { price: L.price })}</div></Banner>}

      <div className="chips" style={{ marginBottom: 16 }}>
        {days.map((d, i) => { const [wd, n] = dayParts(d); return (
          <button key={d} type="button" className={'pill-day' + (d === day ? ' on' : '')} onClick={() => { setDay(d); setSel(null); }} aria-label={fmtDate(d, lang)} aria-pressed={d === day}>
            <span>{i === 0 ? t('common.today') : wd}</span><b>{n}</b>
          </button>
        ); })}
      </div>

      <Card style={{ padding: '6px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 6px' }}>
          <span className="label" style={{ width: 96, flexShrink: 0 }}>{t('laundry.time')}</span>
          <span style={grid}>{Array.from({ length: L.machines }, (_, i) => <span key={i} className="label" style={{ textAlign: 'center' }}>{i + 1}</span>)}</span>
        </div>
        {slots.map(s => (
          <div key={s.start} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <span className="num" style={{ width: 96, flexShrink: 0, fontSize: 14, fontWeight: 700, color: s.past ? '#B9B3AE' : C.text }}>{s.label}</span>
            <span style={grid}>
              {s.machines.map(m => {
                const isSel = sel && sel.start === s.start && sel.machine === m.n;
                const cls = 'm' + (isSel ? ' sel' : m.mine ? ' mine' : m.taken ? ' taken hatch' : '') + (s.past ? ' past' : '');
                return (
                  <button key={m.n} type="button" className={cls} disabled={s.past || m.taken || m.mine} onClick={() => { setError(''); setSel(isSel ? null : { start: s.start, machine: m.n }); }} aria-label={s.label + ' · ' + t('laundry.machine', { n: m.n })} aria-pressed={!!isSel}>
                    {m.mine ? <Icon name="Check" size={18}/> : m.n}
                  </button>
                );
              })}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 14, padding: '12px 0 4px', fontSize: 12, fontWeight: 700, color: C.textMuted, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="hatch" style={{ width: 14, height: 14, borderRadius: 4 }}/>{t('laundry.legendTaken')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: C.infoSoft }}/>{t('laundry.legendMine')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: BRAND.red }}/>{t('laundry.legendSel')}</span>
        </div>
      </Card>
      <div className="hint" style={{ margin: '12px 2px 0' }}>{t('laundry.legend')} {t('laundry.fee', { price: L.price })}</div>
      {error && <Banner tone="danger" icon="AlertCircle" style={{ marginTop: 12 }}>{error}</Banner>}

      <SectionLabel>{t('laundry.mine')}</SectionLabel>
      {active.length ? (
        <Card className="rows" style={{ padding: '4px 18px' }}>
          {active.map(b => (
            <div key={b.id} className="row">
              <IconBox name="Clock" tone="info"/>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{(b.day === dayISO(now) ? t('common.today') : fmtDate(b.day, lang)) + ' ' + slotLabel(b.start, b.len || 2) + ' · ' + t('laundry.machine', { n: b.machine })}</span>
                <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 3 }}>{t('laundry.reminder')}</span>
              </span>
              {canCancel(b) && <button type="button" style={{ ...secondaryBtn, width: 'auto', minHeight: 34, padding: '0 12px', fontSize: 12, borderRadius: 999, boxShadow: 'inset 0 0 0 1.5px rgba(23,22,26,0.08)' }} onClick={() => setConfirm(b.id)}>{t('laundry.cancel')}</button>}
            </div>
          ))}
        </Card>
      ) : <EmptyState icon="WashingMachine" title={t('laundry.none')}/>}
      <div style={{ height: 104 }}/>

      <div style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(100px + env(safe-area-inset-bottom))', zIndex: 18, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', maxWidth: 608, margin: '0 auto', background: C.card, borderRadius: C.radius, boxShadow: '0 -8px 30px rgba(23,22,26,0.08), 0 16px 40px rgba(23,22,26,0.14)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {sel && <div className="label" style={{ color: BRAND.red }}>{t('laundry.selected')}</div>}
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: sel ? 4 : 0, lineHeight: 1.3, letterSpacing: '-0.01em', color: sel ? C.text : C.textMuted }}>{sel ? fmtDate(day, lang) + ' · ' + slotLabel(sel.start, L.slotHours) + ' · ' + t('laundry.machine', { n: sel.machine }) : t('laundry.pick')}</div>
            {sel && <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{L.price}</div>}
          </div>
          <button type="button" style={{ ...primaryBtn, width: 'auto', minWidth: 132, minHeight: 52, padding: '0 20px', fontSize: 16, opacity: sel ? 1 : 0.45, boxShadow: sel ? primaryBtn.boxShadow : 'none' }} onClick={book} disabled={!sel}>{t('laundry.book')}</button>
        </div>
      </div>

      <Sheet open={!!confirm} title={t('laundry.cancelConfirm')} onClose={() => setConfirm(null)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" style={{ ...secondaryBtn, flex: 1 }} onClick={() => setConfirm(null)}>{t('common.no')}</button>
          <button type="button" style={{ ...primaryBtn, flex: 1 }} onClick={() => { cancelBooking(confirm); setConfirm(null); }}>{t('common.yes')}</button>
        </div>
      </Sheet>
    </>
  );
}
