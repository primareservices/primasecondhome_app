import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANG, detectLang } from './config/languages.js';
import { propertyById } from './config/properties.js';
import { I18nContext, hasDict, loadDict, makeT, readStoredLang, storeLang } from './i18n/index.js';
import { contentSync, loadContent } from './content/index.js';
import { AppContext } from './app-context.js';
import { getPublicPropertyId, getRulesAck, getSession, listAnnouncements, listRequests, subscribe } from './data/adapter.js';
import { isOpen } from './domain/request-status.js';
import { useRoute } from './router.js';
import { navigate } from './router.js';
import { GlobalStyles } from './ui/GlobalStyles.jsx';
import { Card, primaryBtn } from './ui/primitives.jsx';
import { Icon } from './ui/icons.jsx';
import { Shell } from './shell/index.jsx';
import { Welcome } from './screens/welcome/Welcome.jsx';
import { RulesAck } from './screens/rules/RulesAck.jsx';
import { Rules } from './screens/rules/Rules.jsx';
import { Home } from './screens/home/Home.jsx';
import { Report } from './screens/report/Report.jsx';
import { Services } from './screens/services/Services.jsx';
import { ServiceForm } from './screens/services/ServiceForm.jsx';
import { Requests } from './screens/requests/Requests.jsx';
import { RequestDetail } from './screens/requests/RequestDetail.jsx';
import { Documents } from './screens/documents/Documents.jsx';
import { Info } from './screens/info/Info.jsx';
import { Guide, Guides } from './screens/guides/Guides.jsx';
import { Contacts } from './screens/contacts/Contacts.jsx';
import { Feedback } from './screens/feedback/Feedback.jsx';
import { Announcements } from './screens/announcements/Announcements.jsx';
import { Profile } from './screens/profile/Profile.jsx';

// Obrazovky, ktoré vyžadujú prihláseného hosťa; v informačnom režime dostanú výzvu na kód.
function NeedCode({ t }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{t('home.publicMode')}</div>
      <div style={{ fontSize: 14, color: '#667085' }}>{t('home.publicModeSub')}</div>
      <button type="button" style={primaryBtn} onClick={() => navigate('/welcome?step=code')}><Icon name="KeyRound" size={18}/>{t('home.signInCta')}</button>
    </Card>
  );
}
function screenFor(route, stay, t) {
  const [a, b] = route.segs;
  const guard = (el) => (stay ? el : <NeedCode t={t}/>);
  switch (a || '') {
    case '': return <Home/>;
    case 'report': return guard(<Report query={route.query}/>);
    case 'services': return guard(b ? <ServiceForm type={b}/> : <Services/>);
    case 'requests': return guard(b ? <RequestDetail id={b}/> : <Requests/>);
    case 'documents': return guard(<Documents/>);
    case 'info': return b === 'rules' ? <Rules/> : <Info/>;
    case 'guides': return b ? <Guide id={b}/> : <Guides/>;
    case 'contacts': return <Contacts/>;
    case 'feedback': return guard(<Feedback/>);
    case 'announcements': return <Announcements/>;
    case 'profile': return <Profile/>;
    default: return <Home/>;
  }
}

export function App() {
  const [storedLang, setStoredLang] = useState(() => readStoredLang());
  const [lang, setLangState] = useState(() => storedLang || detectLang(typeof navigator !== 'undefined' ? (navigator.languages || [navigator.language]) : []));
  const [dictVersion, setDictVersion] = useState(0);
  const [content, setContent] = useState(() => contentSync(lang));
  useEffect(() => {
    let alive = true;
    Promise.all([loadDict(lang), loadContent(lang)]).then(([, c]) => { if (!alive) return; setContent(c); setDictVersion(v => v + 1); }).catch(() => {});
    document.documentElement.lang = lang;
    return () => { alive = false; };
  }, [lang]);
  const setLang = (code) => { storeLang(code); setStoredLang(code); setLangState(code); };
  const ready = hasDict(lang);
  const t = useMemo(() => makeT(hasDict(lang) ? lang : DEFAULT_LANG), [lang, dictVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const route = useRoute();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  const session = useMemo(() => getSession(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const stay = session ? session.stay : null;
  const publicPid = useMemo(() => getPublicPropertyId(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const property = propertyById(stay ? stay.propertyId : publicPid);
  const rulesAck = useMemo(() => (stay ? getRulesAck(stay.id) : null), [stay, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const badges = useMemo(() => ({
    home: property ? listAnnouncements(property.id).filter(a => a.unread).length : 0,
    requests: stay ? listRequests(stay.id).filter(isOpen).length : 0,
  }), [stay, property, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const ctx = useMemo(() => ({ stay, property, content, publicMode: !stay, refresh: () => setTick(x => x + 1) }), [stay, property, content]);
  useEffect(() => { if (window.__primaBootOk) window.__primaBootOk(); }, []);

  const seg = route.segs[0] || '';
  let body;
  if (!storedLang || (!stay && !property) || seg === 'welcome') {
    body = <Welcome key={route.query.toString()} query={route.query} initialStep={route.query.get('step') || (storedLang ? 'code' : 'lang')} hasLang={!!storedLang}/>;
  } else if (stay && (!rulesAck || rulesAck.version !== content.rules.version) && !(seg === 'info' && route.segs[1] === 'rules')) {
    body = <RulesAck/>;
  } else {
    body = <Shell segs={route.segs} badges={badges}>{screenFor(route, stay, t)}</Shell>;
  }
  return (
    <I18nContext.Provider value={{ t, lang, setLang, ready }}>
      <AppContext.Provider value={ctx}>
        <GlobalStyles/>
        {body}
      </AppContext.Provider>
    </I18nContext.Provider>
  );
}
