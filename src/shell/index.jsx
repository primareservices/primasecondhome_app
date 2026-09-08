import { useEffect, useState } from 'react';
import { BRAND, C } from '../config/theme.js';
import { useT } from '../i18n/index.js';
import { useApp } from '../app-context.js';
import { navigate } from '../router.js';
import { Icon } from '../ui/icons.jsx';
import { PrimaLogo } from '../ui/PrimaLogo.jsx';
import { langMeta } from '../config/languages.js';

const NAV = [
  { key: 'home', path: '/', icon: 'Home', t: 'nav.home', match: ['', 'report', 'services', 'documents', 'announcements', 'laundry'] },
  { key: 'requests', path: '/requests', icon: 'ClipboardList', t: 'nav.requests', match: ['requests'] },
  { key: 'info', path: '/info', icon: 'Info', t: 'nav.info', match: ['info', 'guides', 'contacts', 'around', 'emergency'] },
  { key: 'profile', path: '/profile', icon: 'User', t: 'nav.profile', match: ['profile', 'feedback', 'private'] },
];
export function activeNav(segs) {
  const first = segs[0] || '';
  return (NAV.find(n => n.match.includes(first)) || NAV[0]).key;
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export function Shell({ children, segs, badges }) {
  const { t, lang } = useT();
  const { property } = useApp();
  const online = useOnline();
  const active = activeNav(segs);
  return (
    <div style={{ minHeight: '100dvh' }}>
      <div className="topbar">
        <div className="topbar-inner">
          <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <PrimaLogo size={30} sub={property ? property.name.replace(/^PRIMA\s+/i, '') : t('app.tagline')}/>
          </button>
          <span style={{ flex: 1 }}/>
          <button type="button" onClick={() => navigate('/profile')} aria-label={t('profile.language')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, background: C.card, border: '1px solid ' + C.border, borderRadius: 999,
            padding: '6px 10px', fontSize: 12, fontWeight: 800, color: C.textMuted, letterSpacing: '0.04em', minHeight: 36,
          }}><Icon name="Languages" size={14}/>{langMeta(lang).short}</button>
        </div>
      </div>
      {!online && (
        <div style={{ background: C.warningSoft, borderBottom: '1px solid ' + C.warningBorder, color: C.warningText, fontSize: 13, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="WifiOff" size={15}/>{t('offline.banner')}
        </div>
      )}
      <main className="page fade-in" key={segs.join('/')}>{children}</main>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map(n => {
            const badge = badges && badges[n.key];
            return (
              <button key={n.key} type="button" className={'nav-btn' + (active === n.key ? ' active' : '')} onClick={() => navigate(n.path)}>
                <span style={{ position: 'relative', display: 'flex' }}>
                  <Icon name={n.icon} size={22}/>
                  {badge ? <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 999, background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{badge}</span> : null}
                </span>
                {t(n.t)}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
