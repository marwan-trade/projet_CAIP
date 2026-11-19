import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './services/api.js';
import { useLang } from './i18n.jsx';

// Utilisateur connecté, partagé par toute l'application.
// `utilisateur` vaut undefined pendant la vérification, null si personne n'est connecté.
const SessionContext = createContext(null);

export const ESPACE = { candidat: '/app', conseiller: '/conseiller', administrateur: '/admin' };

export function SessionProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(undefined);
  const { setLang } = useLang();

  const definir = useCallback(
    (u) => {
      setUtilisateur(u);
      if (u?.langue) setLang(u.langue);
    },
    [setLang],
  );

  useEffect(() => {
    api.moi().then(definir).catch(() => setUtilisateur(null));
    const perdu = () => setUtilisateur(null);
    window.addEventListener('caip:deconnecte', perdu);
    return () => window.removeEventListener('caip:deconnecte', perdu);
  }, [definir]);

  const deconnecter = useCallback(async () => {
    await api.deconnexion().catch(() => {});
    setUtilisateur(null);
  }, []);

  return <SessionContext.Provider value={{ utilisateur, definir, deconnecter }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
