import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import PageLoader from './components/PageLoader.jsx';

// Une page = un fichier chargé à la demande.
const Accueil = lazy(() => import('./pages/public/Accueil.jsx'));
const Connexion = lazy(() => import('./pages/public/Connexion.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));
const Reinitialiser = lazy(() => import('./pages/public/Reinitialiser.jsx'));

const TableauDeBord = lazy(() => import('./pages/candidat/TableauDeBord.jsx'));
const Modeles = lazy(() => import('./pages/candidat/Modeles.jsx'));
const Depot = lazy(() => import('./pages/candidat/Depot.jsx'));
const Rapport = lazy(() => import('./pages/candidat/Rapport.jsx'));
const Entretiens = lazy(() => import('./pages/candidat/Entretiens.jsx'));
const Formation = lazy(() => import('./pages/candidat/Formation.jsx'));
const Accompagnement = lazy(() => import('./pages/candidat/Accompagnement.jsx'));
const Profil = lazy(() => import('./pages/candidat/Profil.jsx'));

const Demandes = lazy(() => import('./pages/conseiller/Demandes.jsx'));
const Messages = lazy(() => import('./pages/conseiller/Messages.jsx'));
const Ressources = lazy(() => import('./pages/conseiller/Ressources.jsx'));

const Indicateurs = lazy(() => import('./pages/admin/Indicateurs.jsx'));
const Contenus = lazy(() => import('./pages/admin/Contenus.jsx'));
const Comptes = lazy(() => import('./pages/admin/Comptes.jsx'));
const Assignations = lazy(() => import('./pages/admin/Assignations.jsx'));
const Audit = lazy(() => import('./pages/admin/Audit.jsx'));

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
          <Route path="/reinitialiser" element={<Reinitialiser />} />

          <Route path="/app" element={<AppLayout role="candidat" />}>
            <Route index element={<TableauDeBord />} />
            <Route path="modeles" element={<Modeles />} />
            <Route path="analyse/nouvelle" element={<Depot />} />
            <Route path="analyse/rapport" element={<Rapport />} />
            <Route path="entretiens" element={<Entretiens />} />
            <Route path="formation" element={<Formation />} />
            <Route path="accompagnement" element={<Accompagnement />} />
            <Route path="profil" element={<Profil />} />
            <Route path="*" element={<NotFound retour="/app" />} />
          </Route>

          <Route path="/conseiller" element={<AppLayout role="conseiller" />}>
            <Route index element={<Demandes />} />
            <Route path="messages" element={<Messages />} />
            <Route path="ressources" element={<Ressources />} />
            <Route path="*" element={<NotFound retour="/conseiller" />} />
          </Route>

          <Route path="/admin" element={<AppLayout role="admin" />}>
            <Route index element={<Indicateurs />} />
            <Route path="contenus" element={<Contenus />} />
            <Route path="comptes" element={<Comptes />} />
            <Route path="assignations" element={<Assignations />} />
            <Route path="audit" element={<Audit />} />
            <Route path="*" element={<NotFound retour="/admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
