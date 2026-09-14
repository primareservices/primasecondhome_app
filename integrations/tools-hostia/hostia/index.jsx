// ── Modul: Hostia — PRIMA SECOND HOME ──────────────────────────────────────────────────
// Recepcia a office spravujú hostí v appke PRIMA SECOND HOME: pobyty a kódy (lístok s QR pri
// check-ine, hromadný import z exportu Casistu), žiadosti hostí (služby, doklady, súkromné
// hlásenia — poruchy idú automaticky do RE SERVICE), správy s hosťami (preklad DeepL) a oznamy.
// Dáta žijú v oddelenom Supabase projekte hostí (api.js), TOOLS sa doň prihlási druhým účtom.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, AlertCircle, Plus, Upload, Printer, LogOut, RefreshCw, Send, Megaphone, MessageSquare, ClipboardList, Users, Languages, FileCheck, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { C, BRAND, inputStyle } from '../../ui/tokens.js';
import { Card, Field, Heading } from '../../ui/components.jsx';
import { ModStyles, Badge, Empty, SearchBox } from '../zamestnanci/ui.jsx';
import { btn, btnPri, mono, ModalShell, ModStyledExtras, useIsMobile } from '../vykonnost/ui.jsx';
import { home, getOfficeSession, onAuth, signIn, signOut, myOffice, listStays, createStay, issueCode, closeStay, signaturesFor, identityFor, signedUrl, listRequests, setRequestStatus, listMessages, sendReply, markRead, listAnnouncements, saveAnnouncement, deleteAnnouncement, translateText, listProperties } from './api.js';
import { LANGS, LANG_NAME, PROPERTIES, propertyById, genCode, normalizeRoomCode, parseStaysRows, displayName, KIND_LABEL, STATUS_LABEL, OFFICE_STATUSES } from './model.js';
import { Slip, SlipPrintStyles } from './Slip.jsx';

const fmtD = (iso) => (iso ? new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '—');
const fmtDT = (iso) => (iso ? new Date(iso).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const today = () => new Date().toISOString().slice(0, 10);
const hashParam = (k) => { const m = window.location.hash.match(new RegExp('[?&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; };
const setHashParam = (k, v) => { const [path, q = ''] = window.location.hash.replace(/^#/, '').split('?'); const sp = new URLSearchParams(q); if (v) sp.set(k, v); else sp.delete(k); const s = sp.toString(); window.history.replaceState(null, '', '#' + path + (s ? '?' + s : '')); };
const cell = { padding: '9px 10px', fontSize: 13.5, borderBottom: '1px solid ' + C.border, verticalAlign: 'top' };
const th = { ...cell, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '2px solid ' + C.border, textAlign: 'left', whiteSpace: 'nowrap' };
const select = { ...inputStyle, width: 'auto', padding: '8px 10px' };
const TONE = { reported: 'grey', assigned: 'blue', inProgress: 'blue', longer: 'amber', major: 'red', deferred: 'grey', resolved: 'green', ready: 'green', forwarded: 'blue', received: 'blue', cancelled: 'grey' };

function Spinner() { return <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/>; }
function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 9, background: '#FDECEA', color: '#B3261E', fontSize: 13.5, marginBottom: 12 }}><AlertCircle size={16}/><span style={{ flex: 1 }}>{String(error.message || error)}</span>{onRetry && <button type="button" style={btn} onClick={onRetry}><RefreshCw size={14}/> Znova</button>}</div>;
}
function useLoad(fn, deps) {
  const [state, set] = useState({ loading: true, error: null, data: null });
  const run = useCallback(() => { set(s => ({ ...s, loading: true, error: null })); fn().then(data => set({ loading: false, error: null, data })).catch(error => set(s => ({ ...s, loading: false, error }))); }, deps);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

// ── prihlásenie do projektu hostí ─────────────────────────────────────────────────────
function LoginPanel() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const go = async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await signIn(email.trim(), pw); } catch (x) { setErr(x); } setBusy(false); };
  return (
    <Card style={{ maxWidth: 420 }}>
      <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Prihlásenie do systému hostí</div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>Hostia majú oddelený projekt. Účet recepcie vám založí admin (docs/SETUP_SUPABASE.md §6b).</div>
        <Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="username" required/></Field>
        <Field label="Heslo"><input type="password" value={pw} onChange={e => setPw(e.target.value)} style={inputStyle} autoComplete="current-password" required/></Field>
        <ErrorBox error={err}/>
        <button type="submit" style={btnPri} disabled={busy}>{busy ? <Spinner/> : null} Prihlásiť sa</button>
      </form>
    </Card>
  );
}

// ── lístok po vydaní kódu ─────────────────────────────────────────────────────────────
function SlipSheet({ items, onClose }) {   // items: [{ stay, code, property }]
  return (
    <ModalShell title={items.length > 1 ? `Lístky pre ${items.length} hostí` : 'Lístok pre hosťa'} onClose={onClose} maxWidth={items.length > 1 ? 1100 : 560}>
      <SlipPrintStyles/>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Kód sa zobrazuje len teraz — uložený je iba jeho odtlačok. Vytlačte lístok alebo ho odovzdajte hosťovi.</div>
      <div className="hostia-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {items.map(it => <Slip key={it.code} stay={it.stay} code={it.code} property={it.property} compact={items.length > 1}/>)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" style={btnPri} onClick={() => window.print()}><Printer size={15}/> Tlačiť</button>
        <button type="button" style={btn} onClick={onClose}>Zavrieť</button>
      </div>
    </ModalShell>
  );
}

// ── pobyty ────────────────────────────────────────────────────────────────────────────
function NewStaySheet({ propertyId, properties, onClose, onCreated }) {
  const [f, setF] = useState({ propertyId: propertyId || (properties[0] && properties[0].id) || '', room: '', surname: '', given: '', company: '', checkIn: today(), checkOut: '', lang: 'uk', email: '', coordName: '', coordPhone: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const save = async (e) => {
    e.preventDefault(); setErr(null);
    const room = normalizeRoomCode(f.room); if (!room || !f.surname.trim()) { setErr(new Error('Izba a priezvisko sú povinné.')); return; }
    setBusy(true);
    try {
      const code = genCode(f.propertyId);
      const r = await createStay({ propertyId: f.propertyId, room, surname: f.surname, displayName: displayName({ surname: f.surname, given: f.given }), company: f.company, checkIn: f.checkIn, checkOut: f.checkOut || null, lang: f.lang, email: f.email || null,
        coordinator: f.coordName ? { name: f.coordName, phone: f.coordPhone || null } : null, code });
      onCreated({ stay: { ...f, id: r.id, room, displayName: displayName({ surname: f.surname, given: f.given }) }, code: r.code, property: propertyById(f.propertyId) || properties.find(p => p.id === f.propertyId) });
    } catch (x) { setErr(x); }
    setBusy(false);
  };
  return (
    <ModalShell title="Nový pobyt" onClose={onClose} maxWidth={720}>
      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Budova"><select value={f.propertyId} onChange={up('propertyId')} style={inputStyle}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Izba" hint="ako v RE SERVICE: 111/2, B214, 325"><input value={f.room} onChange={up('room')} style={inputStyle} placeholder="111/2"/></Field>
        <Field label="Priezvisko"><input value={f.surname} onChange={up('surname')} style={inputStyle} required/></Field>
        <Field label="Meno"><input value={f.given} onChange={up('given')} style={inputStyle}/></Field>
        <Field label="Firma (klient)"><input value={f.company} onChange={up('company')} style={inputStyle}/></Field>
        <Field label="Jazyk hosťa"><select value={f.lang} onChange={up('lang')} style={inputStyle}>{LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></Field>
        <Field label="Príchod"><input type="date" value={f.checkIn} onChange={up('checkIn')} style={inputStyle}/></Field>
        <Field label="Odchod"><input type="date" value={f.checkOut} onChange={up('checkOut')} style={inputStyle}/></Field>
        <Field label="E-mail hosťa" hint="voliteľné — kópia podpísaného poriadku"><input type="email" value={f.email} onChange={up('email')} style={inputStyle}/></Field>
        <Field label="Koordinátor (meno · telefón)"><div style={{ display: 'flex', gap: 6 }}><input value={f.coordName} onChange={up('coordName')} style={inputStyle} placeholder="Meno"/><input value={f.coordPhone} onChange={up('coordPhone')} style={inputStyle} placeholder="+421…"/></div></Field>
        <div style={{ gridColumn: '1 / -1' }}><ErrorBox error={err}/><div style={{ display: 'flex', gap: 8 }}><button type="submit" style={btnPri} disabled={busy}>{busy ? <Spinner/> : <Plus size={15}/>} Založiť a vydať kód</button><button type="button" style={btn} onClick={onClose}>Zrušiť</button></div></div>
      </form>
    </ModalShell>
  );
}
function ImportSheet({ propertyId, properties, onClose, onCreated }) {
  const [rows, setRows] = useState(null); const [sel, setSel] = useState({}); const [lang, setLang] = useState('uk'); const [pid, setPid] = useState(propertyId || (properties[0] && properties[0].id) || '');
  const [surnameFirst, setSurnameFirst] = useState(true); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: false, codepage: 1250 });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const { stays, skipped } = parseStaysRows(XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true }), { surnameFirst });
        setRows({ stays, skipped }); setSel(Object.fromEntries(stays.map((_, i) => [i, true])));
      } catch (x) { setErr(x); }
    };
    rd.readAsArrayBuffer(f);
  };
  const create = async () => {
    const picked = rows.stays.filter((_, i) => sel[i]); if (!picked.length) return;
    setBusy(true); setErr(null); const out = [];
    for (const s of picked) {
      try {
        const code = genCode(pid);
        const r = await createStay({ propertyId: pid, room: s.room, surname: s.surname, displayName: s.displayName, company: s.company, checkIn: s.checkIn || today(), checkOut: s.checkOut, lang, code });
        out.push({ stay: { ...s, id: r.id, lang }, code: r.code, property: properties.find(p => p.id === pid) });
      } catch (x) { setErr(new Error(`${s.name}: ${x.message || x}`)); break; }
      setProgress(out.length);
    }
    setBusy(false);
    if (out.length) onCreated(out);
  };
  return (
    <ModalShell title="Import z exportu ubytovacieho systému" onClose={onClose} maxWidth={920}>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, marginBottom: 10 }}>Mesačný XLSX export (stĺpce Meno, Príchod, Odchod, Izba). Každému vybranému hosťovi sa založí pobyt a vydá kód; lístky sa vytlačia naraz.</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end', marginBottom: 12 }}>
        <Field label="Súbor"><input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onFile}/></Field>
        <Field label="Budova"><select value={pid} onChange={e => setPid(e.target.value)} style={select}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Jazyk hostí"><select value={lang} onChange={e => setLang(e.target.value)} style={select}>{LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></Field>
        <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 10 }}><input type="checkbox" checked={surnameFirst} onChange={e => setSurnameFirst(e.target.checked)}/> priezvisko je v mene prvé</label>
      </div>
      <ErrorBox error={err}/>
      {rows && (
        <>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>{rows.stays.length} hostí, {rows.skipped} riadkov bez mena alebo izby preskočených.</div>
          <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid ' + C.border, borderRadius: 9 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}></th><th style={th}>Meno</th><th style={th}>Izba</th><th style={th}>Príchod</th><th style={th}>Odchod</th><th style={th}>Firma</th></tr></thead>
              <tbody>{rows.stays.map((s, i) => <tr key={i}><td style={cell}><input type="checkbox" checked={!!sel[i]} onChange={e => setSel(x => ({ ...x, [i]: e.target.checked }))}/></td><td style={cell}>{s.name}<div style={{ fontSize: 12, color: C.textFaint }}>v appke: {s.displayName}</div></td><td style={{ ...cell, ...mono }}>{s.room}</td><td style={cell}>{fmtD(s.checkIn)}</td><td style={cell}>{fmtD(s.checkOut)}</td><td style={cell}>{s.company || '—'}</td></tr>)}</tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button type="button" style={btnPri} disabled={busy} onClick={create}>{busy ? <Spinner/> : <Plus size={15}/>} Založiť vybraných ({Object.values(sel).filter(Boolean).length})</button>
            {busy && <span style={{ fontSize: 13, color: C.textMuted }}>{progress} hotových…</span>}
            <button type="button" style={btn} onClick={onClose}>Zrušiť</button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
function PobytyPanel({ propertyId, properties }) {
  const [q, setQ] = useState(''); const [sheet, setSheet] = useState(null); const [slips, setSlips] = useState(null); const [err, setErr] = useState(null);
  const { loading, error, data, reload } = useLoad(async () => {
    const stays = await listStays({ propertyId, active: true });
    const ids = stays.map(s => s.id);
    const [sigs, ids2] = await Promise.all([signaturesFor(ids).catch(() => []), identityFor(ids).catch(() => [])]);
    return { stays, sig: Object.fromEntries(sigs.map(s => [s.stay_id, s])), idn: Object.fromEntries(ids2.map(s => [s.stay_id, s])) };
  }, [propertyId]);
  const list = useMemo(() => { const n = q.trim().toLowerCase(); const st = (data && data.stays) || []; return n ? st.filter(s => [s.room, s.display_name, s.client_company].some(x => String(x || '').toLowerCase().includes(n))) : st; }, [data, q]);
  const newCode = async (s) => { setErr(null); try { const code = await issueCode(s.id, genCode(s.property_id), 14); setSlips([{ stay: s, code, property: propertyById(s.property_id) || properties.find(p => p.id === s.property_id) }]); } catch (x) { setErr(x); } };
  const close = async (s) => { if (!window.confirm(`Odhlásiť ${s.display_name || s.room}? Hosť stratí prístup do appky.`)) return; try { await closeStay(s.id); reload(); } catch (x) { setErr(x); } };
  const openPdf = async (sig) => { try { const u = await signedUrl(sig.pdf_path); window.open(u, '_blank'); } catch (x) { setErr(x); } };
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: '1 1 220px' }}><SearchBox value={q} onChange={setQ} placeholder="Izba, meno, firma…"/></div>
        <button type="button" style={btnPri} onClick={() => setSheet('new')}><Plus size={15}/> Nový pobyt</button>
        <button type="button" style={btn} onClick={() => setSheet('import')}><Upload size={15}/> Import z exportu</button>
        <button type="button" style={btn} onClick={reload}><RefreshCw size={14}/></button>
      </div>
      <ErrorBox error={error || err} onRetry={reload}/>
      {loading ? <div style={{ padding: 20, color: C.textMuted }}><Spinner/></div> : !list.length ? <Empty>Žiadne aktívne pobyty. Založte prvý alebo importujte export.</Empty> : (
        <Card style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Izba</th><th style={th}>Hosť</th><th style={th}>Firma</th><th style={th}>Pobyt</th><th style={th}>Jazyk</th><th style={th}>Podpis</th><th style={th}>Doklad</th><th style={th}></th></tr></thead>
            <tbody>{list.map(s => { const sig = data.sig[s.id]; const idn = data.idn[s.id]; return (
              <tr key={s.id}>
                <td style={{ ...cell, ...mono, fontWeight: 700 }}>{s.room}</td>
                <td style={cell}>{s.display_name || '—'}{s.email ? <div style={{ fontSize: 12, color: C.textFaint }}>{s.email}</div> : null}</td>
                <td style={cell}>{s.client_company || '—'}</td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}>{fmtD(s.check_in)} – {fmtD(s.check_out)}</td>
                <td style={cell}>{LANG_NAME[s.lang] || s.lang || '—'}</td>
                <td style={cell}>{sig ? <button type="button" style={{ ...btn, padding: '4px 8px', fontSize: 12 }} onClick={() => sig.pdf_path ? openPdf(sig) : null} title={sig.pdf_path ? 'Otvoriť PDF' : 'PDF ešte na serveri nie je'}><FileCheck size={13}/> {fmtD(sig.signed_at)}</button> : <Badge tone="grey">nepodpísané</Badge>}</td>
                <td style={cell}>{idn ? <Badge tone={idn.status === 'approved' ? 'green' : idn.status === 'declined' ? 'red' : 'amber'}>{idn.status}</Badge> : <Badge tone="grey">—</Badge>}</td>
                <td style={{ ...cell, whiteSpace: 'nowrap' }}><button type="button" style={{ ...btn, padding: '5px 9px', fontSize: 12.5 }} onClick={() => newCode(s)}><Printer size={13}/> Lístok</button> <button type="button" style={{ ...btn, padding: '5px 9px', fontSize: 12.5, color: C.textMuted }} onClick={() => close(s)}><LogOut size={13}/> Odhlásiť</button></td>
              </tr>); })}</tbody>
          </table>
        </Card>
      )}
      {sheet === 'new' && <NewStaySheet propertyId={propertyId} properties={properties} onClose={() => setSheet(null)} onCreated={(it) => { setSheet(null); setSlips([it]); reload(); }}/>}
      {sheet === 'import' && <ImportSheet propertyId={propertyId} properties={properties} onClose={() => setSheet(null)} onCreated={(items) => { setSheet(null); setSlips(items); reload(); }}/>}
      {slips && <SlipSheet items={slips} onClose={() => setSlips(null)}/>}
    </>
  );
}

// ── žiadosti ──────────────────────────────────────────────────────────────────────────
function payloadSummary(r) {
  const p = r.payload || {};
  return [p.bags != null ? `${p.bags} vrece` : null, p.slot, p.plate, p.cardReason, p.purpose, p.pickup, p.roomReason, p.anonymous ? 'anonymne' : null].filter(Boolean).join(' · ');
}
function RequestRow({ r, onSaved }) {
  const [status, setStatus] = useState(r.status); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const options = OFFICE_STATUSES[r.kind] || [];
  const save = async () => { setBusy(true); setErr(null); try { await setRequestStatus(r, status, note.trim() || null); setNote(''); onSaved(); } catch (x) { setErr(x); } setBusy(false); };
  const st = r.guest_stays || {};
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><b>{r.ref}</b><Badge tone="brand">{KIND_LABEL[r.kind] || r.kind}</Badge><Badge tone={TONE[r.status] || 'grey'}>{STATUS_LABEL[r.status] || r.status}</Badge>{r.external_ref && <Badge tone="blue">{r.external_ref}</Badge>}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{st.room} · {st.display_name || '—'} · {st.client_company || ''} · {fmtDT(r.created_at)}</div>
          {(r.service || r.category) && <div style={{ fontSize: 13.5, marginTop: 4 }}>{r.service || r.category}{payloadSummary(r) ? ' · ' + payloadSummary(r) : ''}</div>}
          {r.text && <div style={{ fontSize: 14, marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.text}{r.text_sk && r.text_sk !== r.text ? <div style={{ color: C.textMuted, fontSize: 13 }}>SK: {r.text_sk}</div> : null}</div>}
        </div>
        {r.kind !== 'issue' && r.status !== 'cancelled' && (
          <div style={{ flex: '0 1 300px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>{[r.status, ...options].filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}</select>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Poznámka pre hosťa (SK, preloží sa)" style={inputStyle}/>
            <button type="button" style={btnPri} disabled={busy || (status === r.status && !note.trim())} onClick={save}>{busy ? <Spinner/> : null} Uložiť</button>
            <ErrorBox error={err}/>
          </div>
        )}
        {r.kind === 'issue' && <div style={{ fontSize: 12.5, color: C.textMuted, maxWidth: 260 }}>Poruchu rieši RE SERVICE — stav sa hosťovi prenáša automaticky.</div>}
      </div>
    </Card>
  );
}
function ZiadostiPanel({ propertyId }) {
  const [open, setOpen] = useState(true);
  const { loading, error, data, reload } = useLoad(() => listRequests({ propertyId }), [propertyId]);
  const list = (data || []).filter(r => !open || !['resolved', 'cancelled', 'ready'].includes(r.status));
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button type="button" style={{ ...btn, ...(open ? { borderColor: BRAND.red, color: BRAND.redText } : {}) }} onClick={() => setOpen(true)}>Otvorené</button>
        <button type="button" style={{ ...btn, ...(!open ? { borderColor: BRAND.red, color: BRAND.redText } : {}) }} onClick={() => setOpen(false)}>Všetky</button>
        <button type="button" style={btn} onClick={reload}><RefreshCw size={14}/></button>
      </div>
      <ErrorBox error={error} onRetry={reload}/>
      {loading ? <Spinner/> : !list.length ? <Empty>Žiadne žiadosti.</Empty> : list.map(r => <RequestRow key={r.id} r={r} onSaved={reload}/>)}
    </>
  );
}

// ── správy ────────────────────────────────────────────────────────────────────────────
function SpravyPanel({ propertyId }) {
  const mobile = useIsMobile();
  const { loading, error, data, reload } = useLoad(() => listMessages({ propertyId }), [propertyId]);
  const [active, setActive] = useState(null); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const threads = useMemo(() => {
    const by = {};
    for (const m of data || []) { const t = by[m.stay_id] || (by[m.stay_id] = { stayId: m.stay_id, stay: m.guest_stays, msgs: [], unread: 0 }); t.msgs.push(m); if (m.sender === 'guest' && !m.read_at) t.unread += 1; }
    return Object.values(by).sort((a, b) => (a.msgs[a.msgs.length - 1].created_at < b.msgs[b.msgs.length - 1].created_at ? 1 : -1));
  }, [data]);
  const thread = threads.find(t => t.stayId === active) || null;
  useEffect(() => { if (thread) { const ids = thread.msgs.filter(m => m.sender === 'guest' && !m.read_at).map(m => m.id); if (ids.length) markRead(ids).catch(() => {}); } }, [thread && thread.stayId]);   // eslint-disable-line react-hooks/exhaustive-deps
  const reply = async () => { if (!text.trim() || !thread) return; setBusy(true); setErr(null); try { await sendReply(thread.stayId, text.trim()); setText(''); reload(); } catch (x) { setErr(x); } setBusy(false); };
  const ThreadList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {!threads.length && <Empty>Žiadne správy od hostí.</Empty>}
      {threads.map(t => { const last = t.msgs[t.msgs.length - 1]; return (
        <button key={t.stayId} type="button" onClick={() => setActive(t.stayId)} style={{ textAlign: 'left', background: active === t.stayId ? BRAND.redSoft : C.card, border: '1px solid ' + (active === t.stayId ? '#F6D5DA' : C.border), borderRadius: 9, padding: '10px 12px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b style={mono}>{t.stay ? t.stay.room : '?'}</b><span style={{ fontSize: 13 }}>{t.stay ? t.stay.display_name : ''}</span>{t.unread ? <Badge tone="brand">{t.unread}</Badge> : null}<span style={{ marginLeft: 'auto', fontSize: 12, color: C.textFaint }}>{fmtDT(last.created_at)}</span></div>
          <div style={{ fontSize: 13, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>{last.sender === 'reception' ? 'Vy: ' : ''}{(last.tr && last.tr.sk) || last.text}</div>
        </button>); })}
    </div>
  );
  const ThreadView = () => !thread ? <Empty>Vyberte vlákno.</Empty> : (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{mobile && <button type="button" style={btn} onClick={() => setActive(null)}><X size={14}/></button>}<b style={mono}>{thread.stay && thread.stay.room}</b> {thread.stay && thread.stay.display_name} <span style={{ fontSize: 12.5, color: C.textMuted }}>· jazyk {LANG_NAME[thread.stay && thread.stay.lang] || '—'}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflow: 'auto' }}>
        {thread.msgs.map(m => { const mine = m.sender === 'reception'; return (
          <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', background: mine ? C.navy : C.cardAlt, color: mine ? '#fff' : C.text, borderRadius: 12, padding: '8px 12px', fontSize: 14 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{mine ? m.text : ((m.tr && m.tr.sk) || m.text)}</div>
            {!mine && m.tr && m.tr.sk && m.tr.sk !== m.text && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>originál: {m.text}</div>}
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>{fmtDT(m.created_at)}</div>
          </div>); })}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Odpoveď (slovensky — hosť dostane preklad a push)" style={{ ...inputStyle, minHeight: 56 }}/>
      <ErrorBox error={err}/>
      <div><button type="button" style={btnPri} disabled={busy || !text.trim()} onClick={reply}>{busy ? <Spinner/> : <Send size={14}/>} Odoslať</button></div>
    </Card>
  );
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><button type="button" style={btn} onClick={reload}><RefreshCw size={14}/> Obnoviť</button></div>
      <ErrorBox error={error} onRetry={reload}/>
      {loading ? <Spinner/> : mobile ? (active ? <ThreadView/> : <ThreadList/>) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14, alignItems: 'start' }}><ThreadList/><ThreadView/></div>
      )}
    </>
  );
}

// ── oznamy ────────────────────────────────────────────────────────────────────────────
const DEEPL_LANGS = ['en', 'uk', 'ru', 'ro', 'hu', 'vi'];
function AnnouncementSheet({ initial, propertyId, properties, onClose, onSaved }) {
  const [a, setA] = useState(() => initial || { property_id: propertyId || null, severity: 'info', valid_from: new Date().toISOString().slice(0, 16), valid_to: '', texts: { sk: { title: '', body: '' } } });
  const [busy, setBusy] = useState(false); const [tr, setTr] = useState(false); const [err, setErr] = useState(null);
  const sk = a.texts.sk || { title: '', body: '' };
  const setSk = (k) => (e) => setA(x => ({ ...x, texts: { ...x.texts, sk: { ...sk, [k]: e.target.value } } }));
  const translateAll = async () => {
    setTr(true); setErr(null);
    try {
      const [t, b] = await Promise.all([translateText(sk.title, DEEPL_LANGS), translateText(sk.body, DEEPL_LANGS)]);
      setA(x => ({ ...x, texts: { ...x.texts, ...Object.fromEntries(DEEPL_LANGS.filter(l => t[l] || b[l]).map(l => [l, { title: t[l] || sk.title, body: b[l] || sk.body }])) } }));
    } catch (x) { setErr(x); }
    setTr(false);
  };
  const save = async () => {
    if (!sk.title.trim()) { setErr(new Error('Slovenský nadpis je povinný.')); return; }
    setBusy(true); setErr(null);
    try {
      const row = { ...(a.id ? { id: a.id } : {}), property_id: a.property_id || null, severity: a.severity, valid_from: new Date(a.valid_from).toISOString(), valid_to: a.valid_to ? new Date(a.valid_to).toISOString() : null, texts: a.texts };
      await saveAnnouncement(row); onSaved();
    } catch (x) { setErr(x); }
    setBusy(false);
  };
  return (
    <ModalShell title={a.id ? 'Upraviť oznam' : 'Nový oznam'} onClose={onClose} maxWidth={820}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Budova"><select value={a.property_id || ''} onChange={e => setA(x => ({ ...x, property_id: e.target.value || null }))} style={inputStyle}><option value="">Celá sieť</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Dôležitosť"><select value={a.severity} onChange={e => setA(x => ({ ...x, severity: e.target.value }))} style={inputStyle}><option value="info">Info</option><option value="warning">Upozornenie</option><option value="urgent">Naliehavé</option></select></Field>
        <Field label="Platí od" hint="v budúcnosti = naplánovaný push"><input type="datetime-local" value={a.valid_from} onChange={e => setA(x => ({ ...x, valid_from: e.target.value }))} style={inputStyle}/></Field>
        <Field label="Platí do"><input type="datetime-local" value={a.valid_to || ''} onChange={e => setA(x => ({ ...x, valid_to: e.target.value }))} style={inputStyle}/></Field>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Nadpis (SK)"><input value={sk.title} onChange={setSk('title')} style={inputStyle}/></Field></div>
        <div style={{ gridColumn: '1 / -1' }}><Field label="Text (SK)"><textarea value={sk.body} onChange={setSk('body')} rows={3} style={{ ...inputStyle, minHeight: 70 }}/></Field></div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" style={btn} disabled={tr || !sk.title.trim()} onClick={translateAll}>{tr ? <Spinner/> : <Languages size={14}/>} Preložiť (DeepL: EN, UK, RU, RO, HU, VI)</button>
          <span style={{ fontSize: 12.5, color: C.textMuted }}>Ostatné jazyky uvidia angličtinu.</span>
        </div>
        {Object.keys(a.texts).filter(l => l !== 'sk').map(l => (
          <div key={l} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
            <input value={a.texts[l].title} onChange={e => setA(x => ({ ...x, texts: { ...x.texts, [l]: { ...x.texts[l], title: e.target.value } } }))} style={inputStyle} placeholder={LANG_NAME[l] + ' — nadpis'}/>
            <input value={a.texts[l].body} onChange={e => setA(x => ({ ...x, texts: { ...x.texts, [l]: { ...x.texts[l], body: e.target.value } } }))} style={inputStyle} placeholder={LANG_NAME[l] + ' — text'}/>
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}><ErrorBox error={err}/><div style={{ display: 'flex', gap: 8 }}><button type="button" style={btnPri} disabled={busy} onClick={save}>{busy ? <Spinner/> : <Megaphone size={14}/>} Uložiť a poslať push</button><button type="button" style={btn} onClick={onClose}>Zrušiť</button></div></div>
      </div>
    </ModalShell>
  );
}
function OznamyPanel({ propertyId, properties }) {
  const { loading, error, data, reload } = useLoad(() => listAnnouncements({ propertyId }), [propertyId]);
  const [edit, setEdit] = useState(null); const [err, setErr] = useState(null);
  const del = async (a) => { if (!window.confirm('Zmazať oznam?')) return; try { await deleteAnnouncement(a.id); reload(); } catch (x) { setErr(x); } };
  const now = Date.now();
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><button type="button" style={btnPri} onClick={() => setEdit({})}><Plus size={15}/> Nový oznam</button><button type="button" style={btn} onClick={reload}><RefreshCw size={14}/></button></div>
      <ErrorBox error={error || err} onRetry={reload}/>
      {loading ? <Spinner/> : !(data || []).length ? <Empty>Žiadne oznamy.</Empty> : (data || []).map(a => { const sk = a.texts.sk || a.texts.en || {}; const live = new Date(a.valid_from).getTime() <= now && (!a.valid_to || new Date(a.valid_to).getTime() >= now); return (
        <Card key={a.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={a.severity === 'urgent' ? 'red' : a.severity === 'warning' ? 'amber' : 'blue'}>{a.severity}</Badge>
            <b>{sk.title}</b>
            <span style={{ fontSize: 12.5, color: C.textMuted }}>{a.property_id ? (properties.find(p => p.id === a.property_id) || {}).name || a.property_id : 'celá sieť'} · {fmtDT(a.valid_from)}{a.valid_to ? ' – ' + fmtDT(a.valid_to) : ''}</span>
            <Badge tone={live ? 'green' : 'grey'}>{live ? 'aktívny' : new Date(a.valid_from).getTime() > now ? 'naplánovaný' : 'skončený'}</Badge>
            {a.pushed_at && <Badge tone="grey">push {fmtDT(a.pushed_at)}</Badge>}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}><button type="button" style={{ ...btn, padding: '5px 9px', fontSize: 12.5 }} onClick={() => setEdit({ ...a, valid_from: a.valid_from.slice(0, 16), valid_to: a.valid_to ? a.valid_to.slice(0, 16) : '' })}>Upraviť</button><button type="button" style={{ ...btn, padding: '5px 9px', fontSize: 12.5, color: C.textMuted }} onClick={() => del(a)}><Trash2 size={13}/></button></span>
          </div>
          <div style={{ fontSize: 13.5, color: C.text, marginTop: 6 }}>{sk.body}</div>
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>jazyky: {Object.keys(a.texts).join(', ')}</div>
        </Card>); })}
      {edit && <AnnouncementSheet initial={edit.id ? edit : null} propertyId={propertyId} properties={properties} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }}/>}
    </>
  );
}

// ── modul ─────────────────────────────────────────────────────────────────────────────
const TABS = [['pobyty', 'Pobyty a kódy', Users], ['ziadosti', 'Žiadosti', ClipboardList], ['spravy', 'Správy', MessageSquare], ['oznamy', 'Oznamy', Megaphone]];
export default function Hostia() {
  const mobile = useIsMobile();
  const [session, setSession] = useState(undefined);
  const [office, setOffice] = useState(null);
  const [props, setProps] = useState(PROPERTIES);
  const [pid, setPid] = useState(hashParam('b') || '');
  const [tab, setTabState] = useState(hashParam('tab') || 'pobyty');
  const setTab = (t) => { setTabState(t); setHashParam('tab', t); };
  useEffect(() => {
    if (!home) return undefined;
    getOfficeSession().then(setSession).catch(() => setSession(null));
    const { data } = onAuth((s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setOffice(null); return; }
    myOffice().then(o => { setOffice(o); if (o && o.role !== 'admin' && o.property_ids && o.property_ids.length && !pid) setPid(o.property_ids[0]); }).catch(() => setOffice(null));
    listProperties().then(ps => { if (ps && ps.length) setProps(ps.map(p => ({ ...p, qr: (PROPERTIES.find(x => x.id === p.id) || {}).qr }))); }).catch(() => {});
  }, [session]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!home) return <Card><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><AlertCircle size={18} color={BRAND.red}/> Modul Hostia nie je nastavený: do <code>src/config.js</code> doplňte <code>HOME_SUPABASE_URL</code> a <code>HOME_SUPABASE_ANON_KEY</code> projektu hostí.</div></Card>;
  if (session === undefined) return <div style={{ padding: 24, color: C.textMuted }}><Spinner/></div>;
  const visibleProps = office && office.role !== 'admin' ? props.filter(p => (office.property_ids || []).includes(p.id)) : props;
  return (
    <div>
      <ModStyles/><ModStyledExtras/>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <Heading title={mobile ? 'Hostia' : 'Hostia · PRIMA SECOND HOME'} subtitle={session ? `${mobile ? 'PRIMA SECOND HOME · ' : ''}${office ? office.name || office.email : session.user.email}${office ? ' · ' + office.role : ''}` : 'Pobyty, kódy, žiadosti, správy a oznamy pre hostí v appke PRIMA SECOND HOME.'}
        right={session ? <>
          <select value={pid} onChange={e => { setPid(e.target.value); setHashParam('b', e.target.value); }} style={select}>{(office && office.role === 'admin') || !office ? <option value="">Všetky budovy</option> : null}{visibleProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button type="button" style={btn} onClick={() => signOut()}><LogOut size={14}/></button>
        </> : null}/>
      {!session ? <LoginPanel/> : office === null && session ? <Card><ErrorBox error={new Error('Tento účet nemá záznam v office_users (docs/SETUP_SUPABASE.md §6b).')}/></Card> : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {TABS.map(([k, label, Ic]) => <button key={k} type="button" onClick={() => setTab(k)} style={{ ...btn, ...(tab === k ? { background: C.navy, color: '#fff', borderColor: C.navy } : {}) }}><Ic size={14}/> {label}</button>)}
          </div>
          {tab === 'pobyty' && <PobytyPanel propertyId={pid || null} properties={visibleProps}/>}
          {tab === 'ziadosti' && <ZiadostiPanel propertyId={pid || null}/>}
          {tab === 'spravy' && <SpravyPanel propertyId={pid || null}/>}
          {tab === 'oznamy' && <OznamyPanel propertyId={pid || null} properties={visibleProps}/>}
        </>
      )}
    </div>
  );
}
