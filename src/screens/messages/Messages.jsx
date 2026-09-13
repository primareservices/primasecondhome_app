import { useEffect, useMemo, useRef, useState } from 'react';
import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { listMessages, markMessagesRead, sendMessage, subscribe } from '../../data/adapter.js';
import { back } from '../../router.js';
import { fmtTime } from '../../lib/format.js';
import { Banner, DictateButton, EmptyState, PageHeader, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

// Správy s recepciou (hotelový „chat“): hosť píše vo svojom jazyku, recepcia dostane preklad
// (DeepL na serveri); odpoveď sa hosťovi ukáže v jeho jazyku, ak preklad existuje.
export function Messages() {
  const { t, lang } = useT();
  const { stay, property } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const all = useMemo(() => listMessages(stay.id), [stay, tick]);
  const now = Date.now();
  const msgs = all.filter(m => new Date(m.createdAt).getTime() <= now);
  useEffect(() => { markMessagesRead(stay.id); }, [stay, msgs.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {   // ukážková odpoveď má čas v budúcnosti — prekresliť, keď nastane
    const t0 = Date.now();
    const future = all.find(m => new Date(m.createdAt).getTime() > t0);
    if (!future) return undefined;
    const id = setTimeout(() => setTick(x => x + 1), new Date(future.createdAt).getTime() - t0 + 50);
    return () => clearTimeout(id);
  }, [all]);
  const [text, setText] = useState('');
  const endRef = useRef(null);
  useEffect(() => { if (endRef.current && msgs.length) endRef.current.scrollIntoView({ block: 'end' }); }, [msgs.length]);
  const send = () => { if (!text.trim()) return; sendMessage(stay.id, text, lang); setText(''); };
  return (
    <>
      <PageHeader title={t('msg.title')} sub={property ? property.name : ''} onBack={() => back('/contacts')}/>
      <Banner tone="info" icon="Languages">{t('msg.intro')}</Banner>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
        {msgs.length === 0 && <EmptyState icon="MessagesSquare" title={t('msg.empty')}/>}
        {msgs.map(m => {
          const mine = m.sender === 'guest';
          const body = mine ? m.text : ((m.tr && (m.tr[lang] || m.tr.en)) || m.text);
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, margin: mine ? '0 6px 4px 0' : '0 0 4px 6px', textAlign: mine ? 'right' : 'left' }}>
                {mine ? t('msg.you') : t('msg.reception')} · {fmtTime(m.createdAt, lang)}{m.sync === 'queued' ? ' · ' + t('requests.queued') : ''}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 18, fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap', background: mine ? C.navy : C.card, color: mine ? '#fff' : C.text, boxShadow: mine ? 'none' : 'inset 0 0 0 1px ' + C.border }}>{body}</div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <div style={{ position: 'sticky', bottom: 'calc(72px + env(safe-area-inset-bottom))', background: C.bg, paddingTop: 8 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder={t('msg.placeholder')} style={{ ...inputStyle, minHeight: 56 }}/>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <DictateButton lang={lang} onText={(s) => setText(v => (v ? v.replace(/\s+$/, '') + ' ' : '') + s)} label={t('common.dictate')} listeningLabel={t('common.listening')}/>
          <button type="button" style={{ ...primaryBtn, flex: 1, minHeight: 44 }} onClick={send} disabled={!text.trim()}><Icon name="Send" size={16}/>{t('msg.send')}</button>
        </div>
      </div>
    </>
  );
}
