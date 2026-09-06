import { useState } from 'react';
import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { submitFeedback } from '../../data/adapter.js';
import { back, navigate } from '../../router.js';
import { Banner, Card, Field, PageHeader, Stars, Toggle, inputStyle, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function Feedback() {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [r, setR] = useState({ cleaning: 0, staff: 0, room: 0, overall: 0 });
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => { submitFeedback(stay.id, { ratings: r, text: text.trim(), anonymous, lang }); setDone(true); };
  if (done) return (
    <div className="fade-in" style={{ textAlign: 'center', paddingTop: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.successSoft, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="CheckCircle2" size={40}/></div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{t('feedback.thanks')}</h1>
      <button type="button" style={{ ...primaryBtn, marginTop: 16 }} onClick={() => navigate('/', { replace: true })}>{t('nav.home')}</button>
    </div>
  );
  return (
    <>
      <PageHeader title={t('feedback.title')} onBack={() => back('/profile')}/>
      <Banner tone="info" icon="ShieldCheck" style={{ marginBottom: 12 }}>{t('feedback.sub')}</Banner>
      <Card style={{ marginBottom: 12 }}>
        {['cleaning', 'staff', 'room', 'overall'].map(k => <Stars key={k} label={t('feedback.' + k)} value={r[k]} onChange={v => setR(x => ({ ...x, [k]: v }))}/>)}
      </Card>
      <Field label={t('feedback.text')} optional><textarea value={text} onChange={e => setText(e.target.value)} rows={4} style={{ ...inputStyle, minHeight: 96 }}/></Field>
      <Card style={{ marginTop: 12, padding: '4px 16px' }}><Toggle checked={anonymous} onChange={setAnonymous} label={t('feedback.anon')}/></Card>
      <button type="button" style={{ ...primaryBtn, marginTop: 16 }} onClick={submit} disabled={!r.overall}><Icon name="Send" size={18}/>{t('feedback.submit')}</button>
    </>
  );
}
