import { SERVICES } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { back, navigate } from '../../router.js';
import { ListRow, PageHeader } from '../../ui/primitives.jsx';

export function Services() {
  const { t } = useT();
  const { property } = useApp();
  const booking = property && property.laundry === 'booking';
  return (
    <>
      <PageHeader title={t('services.title')} sub={t('services.sub')} onBack={() => back('/')}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SERVICES.map(s => <ListRow key={s.key} icon={s.icon} title={t(s.t)} sub={s.key === 'laundry' && booking ? t('svc.laundryBooking') : t(s.sub)} onClick={() => navigate(s.key === 'laundry' && booking ? '/laundry' : '/services/' + s.key)}/>)}
      </div>
    </>
  );
}
