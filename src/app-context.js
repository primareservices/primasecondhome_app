import { createContext, useContext } from 'react';
// Stav pobytu a obsahu pre obrazovky. `stay` je null v informačnom (verejnom) režime.
export const AppContext = createContext({ stay: null, property: null, content: null, pack: null, rules: null, publicMode: true, refresh: () => {} });
export const useApp = () => useContext(AppContext);
