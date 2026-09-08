import { useEffect, useState } from 'react';
import { BRAND, C } from '../config/theme.js';
import { shadow } from '../config/app-config.js';
import { useT } from '../i18n/index.js';
import { useApp } from '../app-context.js';
import { navigate } from '../router.js';
import { Icon } from '../ui/icons.jsx';
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
export function BrandMark({ size = 30, white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="26" fill={white ? '#FFFFFF' : BRAND.red}/>
      <path d="M50 24 L18 50 H27 V78 H44 V60 H56 V78 H73 V50 H82 Z" fill={white ? BRAND.red : '#fff'}/>
      <rect x="62" y="28" width="7" height="14" fill={white ? BRAND.red : '#fff'}/>
    </svg>
  );
}
export function Shell({ children, segs, badges }) {
  const { t, lang } = useT();
  const { property } = useApp();
  const online = useOnline();
  const active = activeNav(segs);
  const unread = badges && badges.home;
  return (
    <div style={{ minHeight: '100dvh' }}>
      <div className="topbar">
        <div className="topbar-inner">
          <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BrandMark/>
            <b style={{ fontSize: 14, letterSpacing: '0.06em', color: BRAND.red }}>PRIMA</b>
          </button>
          {property && <span style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 12px', borderRadius: 999, background: C.card, boxShadow: shadow.sm, fontSize: 12, fontWeight: 800, color: C.text }}>{property.name.replace(/^PRIMA\s+/i, '')}</span>}
          <span style={{ flex: 1 }}/>
          <button type="button" onClick={() => navigate('/announcements')} aria-label={t('home.announcements')} style={{ width: 44, height: 44, borderRadius: 22, background: C.card, border: 'none', boxShadow: shadow.sm, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.text, position: 'relative' }}>
            <Icon name="Bell" size={20}/>
            {unread ? <span style={{ position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: '50%', background: BRAND.red, boxShadow: '0 0 0 2px #fff' }}/> : null}
          </button>
          <button type="button" onClick={() => navigate('/profile')} aria-label={t('profile.language')} style={{ height: 44, padding: '0 12px', borderRadius: 22, background: C.card, border: 'none', boxShadow: shadow.sm, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.text, letterSpacing: '0.06em' }}><Icon name="Languages" size={16}/>{langMeta(lang).short}</button>
        </div>
      </div>
      {!online && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ background: C.warningSoft, color: C.warningText, fontSize: 13, fontWeight: 700, padding: '10px 14px', borderRadius: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="WifiOff" size={15}/>{t('offline.banner')}
          </div>
        </div>
      )}
      <main className="page fade-in" key={segs.join('/')}>{children}</main>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV.map(n => {
            const badge = n.key === 'requests' && badges ? badges.requests : 0;
            return (
              <button key={n.key} type="button" className={'nav-btn' + (active === n.key ? ' active' : '')} onClick={() => navigate(n.path)}>
                <span style={{ position: 'relative', display: 'flex' }}>
                  <Icon name={n.icon} size={22}/>
                  {badge ? <span style={{ position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 999, background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{badge}</span> : null}
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
