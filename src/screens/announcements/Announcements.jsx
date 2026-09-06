import { useEffect, useMemo, useState } from 'react';
import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { listAnnouncements, markAnnouncementsRead, subscribe } from '../../data/adapter.js';
import { back } from '../../router.js';
import { fmtDate } from '../../lib/format.js';
import { Card, EmptyState, PageHeader } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';

export function Announcements() {
  const { t, lang } = useT();
  const { property } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const anns = useMemo(() => property ? listAnnouncements(property.id) : [], [property, tick]);
  useEffect(() => { if (anns.length) markAnnouncementsRead(anns.map(a => a.id)); }, [anns]);
  const sev = { urgent: { t: 'ann.urgent', color: C.text, bg: '#FEE2E2', icon: 'Siren' }, warning: { t: 'ann.warning', color: C.warningText, bg: C.warningSoft, icon: 'AlertTriangle' }, info: { t: 'ann.info', color: C.infoText, bg: C.infoSoft, icon: 'Megaphone' } };
  return (
    <>
      <PageHeader title={t('ann.title')} sub={property ? property.name : ''} onBack={() => back('/')}/>
      {anns.length ? anns.map(a => {
        const tx = a.texts[lang] || a.texts.en;
        const s = sev[a.severity] || sev.info;
        return (
          <Card key={a.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '3px 9px' }}><Icon name={s.icon} size={13}/>{t(s.t)}</span>
              <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 'auto' }}>{t('ann.validUntil', { date: fmtDate(a.validTo, lang) })}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{tx.title}</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: C.text }}>{tx.body}</div>
          </Card>
        );
      }) : <EmptyState icon="Megaphone" title={t('ann.empty')}/>}
    </>
  );
}
