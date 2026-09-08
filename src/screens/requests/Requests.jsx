import { useEffect, useMemo, useState } from 'react';
import { ISSUE_BY_KEY, SERVICE_BY_KEY } from '../../config/catalog.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { listRequests, subscribe } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { fmtDay } from '../../lib/format.js';
import { isOpen } from '../../domain/request-status.js';
import { Chip, EmptyState, ListRow, PageHeader, StatusBadge } from '../../ui/primitives.jsx';

export function requestTitle(r, t) {
  if (r.kind === 'issue') return t((ISSUE_BY_KEY[r.category] || ISSUE_BY_KEY.other).t);
  if (r.kind === 'service') return t((SERVICE_BY_KEY[r.service] || SERVICE_BY_KEY.other).t);
  if (r.kind === 'document') return t('docs.confirmation');
  if (r.kind === 'private') return t('private.title');
  return t('requests.kind.feedback');
}
export function requestIcon(r) {
  if (r.kind === 'issue') return (ISSUE_BY_KEY[r.category] || ISSUE_BY_KEY.other).icon;
  if (r.kind === 'service') return (SERVICE_BY_KEY[r.service] || SERVICE_BY_KEY.other).icon;
  if (r.kind === 'document') return 'FileCheck';
  if (r.kind === 'private') return 'ShieldCheck';
  return 'Star';
}
export function Requests() {
  const { t, lang } = useT();
  const { stay } = useApp();
  const [filter, setFilter] = useState('open');
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const all = useMemo(() => listRequests(stay.id), [stay, tick]);
  const list = all.filter(r => filter === 'all' ? true : filter === 'open' ? isOpen(r) : !isOpen(r));
  return (
    <>
      <PageHeader title={t('requests.title')}/>
      <div className="chips" style={{ marginBottom: 12 }}>
        {['open', 'all', 'closed'].map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{t('requests.filter.' + f)}{f !== 'all' ? ' · ' + all.filter(r => f === 'open' ? isOpen(r) : !isOpen(r)).length : ''}</Chip>)}
      </div>
      {list.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(r => <ListRow key={r.id} icon={requestIcon(r)} title={requestTitle(r, t)} sub={r.ref + ' · ' + t('requests.kind.' + r.kind) + ' · ' + fmtDay(r.createdAt, lang, t)} right={<StatusBadge status={r.status}/>} onClick={() => navigate('/requests/' + r.id)}/>)}
        </div>
      ) : <EmptyState icon="Inbox" title={t('requests.empty')} subtitle={t('requests.emptySub')}/>}
    </>
  );
}
