import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back } from '../../router.js';
import { Banner, Card, PageHeader } from '../../ui/primitives.jsx';

export function RulesBody({ rules }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Banner tone="info" icon="Info">{rules.intro}</Banner>
      {rules.sections.map((s, i) => (
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
  const { content } = useApp();
  return (
    <>
      <PageHeader title={t('rules.title')} sub={t('rules.updated', { date: content.rules.version })} onBack={() => back('/info')}/>
      <RulesBody rules={content.rules}/>
    </>
  );
}
