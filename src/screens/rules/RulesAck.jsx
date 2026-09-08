import { useState } from 'react';
import { C } from '../../config/theme.js';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app-context.js';
import { ackRules } from '../../data/adapter.js';
import { navigate } from '../../router.js';
import { Card, primaryBtn } from '../../ui/primitives.jsx';
import { Icon } from '../../ui/icons.jsx';
import { RulesBody } from './Rules.jsx';

// Zobrazí sa raz po prihlásení; potvrdenie sa ukladá s verziou pravidiel.
export function RulesAck() {
  const { t } = useT();
  const { stay, rules } = useApp();
  const [checked, setChecked] = useState(false);
  return (
    <div className="page page-nonav fade-in">
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 4px' }}>{t('rules.ackTitle')}</h1>
      <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 14 }}>{t('rules.updated', { date: rules.version })}</div>
      <RulesBody rules={rules}/>
      <Card style={{ position: 'sticky', bottom: 12, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15, fontWeight: 600, minHeight: 44 }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 22, height: 22, accentColor: '#BD2435' }}/>
          {t('rules.ack')}
        </label>
        <button type="button" style={{ ...primaryBtn, opacity: checked ? 1 : 0.5 }} disabled={!checked} onClick={() => { ackRules(stay.id, rules.version); navigate('/', { replace: true }); }}>
          <Icon name="Check" size={18}/>{t('common.continue')}
        </button>
      </Card>
    </div>
  );
}
