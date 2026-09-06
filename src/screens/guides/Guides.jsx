import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back, navigate } from '../../router.js';
import { ListRow, PageHeader } from '../../ui/primitives.jsx';
import { GUIDE_ICONS } from '../../ui/icons.jsx';

export function Guides() {
  const { t } = useT();
  const { content } = useApp();
  return (
    <>
      <PageHeader title={t('guides.title')} sub={t('guides.sub')} onBack={() => back('/')}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {content.guides.map(g => <ListRow key={g.id} icon={GUIDE_ICONS[g.id] || 'BookOpen'} title={g.title} sub={g.summary} onClick={() => navigate('/guides/' + g.id)}/>)}
      </div>
    </>
  );
}
export function Guide({ id }) {
  const { t } = useT();
  const { content } = useApp();
  const g = content.guides.find(x => x.id === id);
  if (!g) { navigate('/guides', { replace: true }); return null; }
  return (
    <>
      <PageHeader title={g.title} sub={g.summary} onBack={() => back('/guides')}/>
      <div className="guide">
        {g.blocks.map((b, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            {b.h && <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>{b.h}</h3>}
            {(b.p || []).map((p, j) => <p key={j}>{p}</p>)}
            {b.list && <ul>{b.list.map((li, j) => <li key={j}>{li}</li>)}</ul>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#98A2B3', marginTop: 8 }}>{t('contacts.iom')}: 0850 211 478 · mic.iom.sk</div>
    </>
  );
}
