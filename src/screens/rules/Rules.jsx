import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back } from '../../router.js';
import { Banner, Card, PageHeader } from '../../ui/primitives.jsx';

// Dva tvary: sieťový vzor (sections[].items[]) a poriadok budovy z content packu (items[] {title,text}).
export function RulesBody({ rules }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Banner tone="info" icon="Info">{rules.intro}</Banner>
      {rules.items ? rules.items.map((it, i) => (
        <Card key={i} style={{ padding: '12px 16px', display: 'flex', gap: 12 }}>
          <b style={{ color: '#BD2435', fontSize: 15, width: 22, flexShrink: 0 }}>{i + 1}.</b>
          <div><div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{it.title}</div><div style={{ fontSize: 15, lineHeight: 1.5, color: C.text }}>{it.text}</div></div>
        </Card>
      )) : rules.sections.map((s, i) => (
        <Card key={i} style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{i + 1}. {s.title}</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.55, color: C.text }}>
            {s.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{it}</li>)}
          </ul>
        </Card>
      ))}
    </div>
  );
}
export function Rules() {
  const { t } = useT();
  const { rules } = useApp();
  return (
    <>
      <PageHeader title={t('rules.title')} sub={t('rules.updated', { date: rules.version })} onBack={() => back('/info')}/>
      <RulesBody rules={rules}/>
    </>
  );
}
