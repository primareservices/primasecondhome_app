import { SERVICES } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { back, navigate } from '../../router.js';
import { ListRow, PageHeader } from '../../ui/primitives.jsx';

export function Services() {
  const { t } = useT();
  return (
    <>
      <PageHeader title={t('services.title')} sub={t('services.sub')} onBack={() => back('/')}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SERVICES.map(s => <ListRow key={s.key} icon={s.icon} title={t(s.t)} sub={t(s.sub)} onClick={() => navigate('/services/' + s.key)}/>)}
      </div>
    </>
  );
}
