import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import PageLoader from './components/PageLoader.jsx';

// Une page = un fichier chargé à la demande.
const Accueil = lazy(() => import('./pages/public/Accueil.jsx'));
const Connexion = lazy(() => import('./pages/public/Connexion.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));

const TableauDeBord = lazy(() => import('./pages/candidat/TableauDeBord.jsx'));
const Modeles = lazy(() => import('./pages/candidat/Modeles.jsx'));
const Depot = lazy(() => import('./pages/candidat/Depot.jsx'));
const Rapport = lazy(() => import('./pages/candidat/Rapport.jsx'));
const Entretiens = lazy(() => import('./pages/candidat/Entretiens.jsx'));
const Formation = lazy(() => import('./pages/candidat/Formation.jsx'));
const Accompagnement = lazy(() => import('./pages/candidat/Accompagnement.jsx'));
const Profil = lazy(() => import('./pages/candidat/Profil.jsx'));

const Demandes = lazy(() => import('./pages/conseiller/Demandes.jsx'));
const Indicateurs = lazy(() => import('./pages/admin/Indicateurs.jsx'));

// Sections prévues mais pas encore conçues (messagerie conseiller, gestion des contenus…).
function Bientot({ retour }) {
  return <NotFound titre="Cette porte s’ouvrira bientôt." texte="Cette section est prévue dans une prochaine version." retour={retour} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/connexion" element={<Connexion />} />

          <Route path="/app" element={<AppLayout role="candidat" />}>
            <Route index element={<TableauDeBord />} />
            <Route path="modeles" element={<Modeles />} />
            <Route path="analyse/nouvelle" element={<Depot />} />
            <Route path="analyse/rapport" element={<Rapport />} />
            <Route path="entretiens" element={<Entretiens />} />
            <Route path="formation" element={<Formation />} />
            <Route path="accompagnement" element={<Accompagnement />} />
            <Route path="profil" element={<Profil />} />
          </Route>

          <Route path="/conseiller" element={<AppLayout role="conseiller" />}>
            <Route index element={<Demandes />} />
            <Route path="*" element={<Bientot retour="/conseiller" />} />
          </Route>

          <Route path="/admin" element={<AppLayout role="admin" />}>
            <Route index element={<Indicateurs />} />
            <Route path="*" element={<Bientot retour="/admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
