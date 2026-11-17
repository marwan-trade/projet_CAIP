import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Traductions de l'interface commune (navigation, boutons, libellés).
// Le contenu des pages est en français pour cette première version ;
// chaque nouvelle chaîne s'ajoute ici dans les deux langues.
const dict = {
  fr: {
    'nav.home': 'Accueil',
    'nav.templates': 'Modèles',
    'nav.analyses': 'Analyses',
    'nav.interviews': 'Entretiens',
    'nav.training': 'Formation',
    'nav.advisor': 'Conseiller',
    'nav.requests': 'Demandes',
    'nav.messages': 'Messages',
    'nav.resources': 'Ressources',
    'nav.indicators': 'Indicateurs',
    'nav.contents': 'Contenus',
    'nav.accounts': 'Comptes',
    'nav.assignments': 'Assignations',
    'nav.audit': "Journal d'audit",
    'nav.main': 'Navigation principale',
    'nav.profile': 'Profil et données',
    'nav.logout': 'Se déconnecter',
    'cta.signup': 'Créer mon compte',
    'cta.login': 'Se connecter',
    'cta.templates': 'Voir les modèles',
    'cta.newAnalysis': 'Nouvelle analyse',
    'lang.switch': 'Changer de langue',
    'skip': 'Aller au contenu',
    'loading': 'Chargement…',
    'notifications': 'Notifications',
  },
  en: {
    'nav.home': 'Home',
    'nav.templates': 'Templates',
    'nav.analyses': 'Reviews',
    'nav.interviews': 'Interviews',
    'nav.training': 'Training',
    'nav.advisor': 'Advisor',
    'nav.requests': 'Requests',
    'nav.messages': 'Messages',
    'nav.resources': 'Resources',
    'nav.indicators': 'Indicators',
    'nav.contents': 'Content',
    'nav.accounts': 'Accounts',
    'nav.assignments': 'Assignments',
    'nav.audit': 'Audit log',
    'nav.main': 'Main navigation',
    'nav.profile': 'Profile and data',
    'nav.logout': 'Log out',
    'cta.signup': 'Create my account',
    'cta.login': 'Log in',
    'cta.templates': 'Browse templates',
    'cta.newAnalysis': 'New review',
    'lang.switch': 'Change language',
    'skip': 'Skip to content',
    'loading': 'Loading…',
    'notifications': 'Notifications',
  },
};

const LangContext = createContext(null);

function readStoredLang() {
  try {
    const v = window.localStorage.getItem('caip-lang');
    return v === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem('caip-lang', lang);
    } catch {
      /* stockage indisponible : on garde la langue en mémoire */
    }
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === 'fr' ? 'en' : 'fr')), []);
  const t = useCallback((key) => dict[lang][key] ?? dict.fr[key] ?? key, [lang]);
  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, toggle, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang doit être utilisé dans <LangProvider>');
  return ctx;
}
