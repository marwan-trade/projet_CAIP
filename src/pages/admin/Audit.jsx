import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Badge, Card, Chips, ErreurChargement, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import { dateHeure } from '../../format.js';

const FILTRES = [
  { value: '', label: 'Tout' },
  { value: 'compte', label: 'Comptes' },
  { value: 'connexion', label: 'Connexions' },
  { value: 'demande', label: 'Demandes' },
  { value: 'contenu', label: 'Contenus' },
  { value: 'document', label: 'Documents' },
];

const LIBELLES = {
  'compte.cree': 'Compte créé',
  'compte.modifie': 'Compte modifié',
  'compte.supprime': 'Compte supprimé',
  'compte.bloque': 'Compte bloqué',
  connexion: 'Connexion',
  'demande.assignee': 'Demande assignée',
  'demande.reassignee': 'Demande réassignée',
  'demande.en_cours': 'Demande prise en charge',
  'demande.cloturee': 'Demande clôturée',
  'contenu.publie': 'Contenu publié',
  'contenu.retire': 'Contenu retiré',
  'contenu.supprime': 'Contenu supprimé',
  'document.supprime': 'Document supprimé',
  'recommandation.signalee': 'Recommandation signalée',
  'mot_de_passe.reinitialise': 'Mot de passe changé',
  'partenaire.ajoute': 'Partenaire ajouté',
  'partenaire.supprime': 'Partenaire supprimé',
  'base.initialisee': 'Base initialisée',
};

const ton = (a) => (a.includes('supprime') || a.includes('bloque') ? 'warn' : a.startsWith('demande') ? 'success' : 'info');

export default function Audit() {
  const [filtre, setFiltre] = useState('');
  const { data, loading, error, recharger } = useAsync(() => api.audit(filtre), [filtre]);

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;

  return (
    <>
      <PageHeader eyebrow="Administration" title="Journal d’audit" subtitle="Les actions sensibles, de la plus récente à la plus ancienne (200 dernières)." />
      <Card className="rise">
        <Chips label="Filtrer par type" value={filtre} onChange={setFiltre} options={FILTRES} />
        {loading && !data ? (
          <PageSkeleton />
        ) : data.length === 0 ? (
          <p className="muted">Aucune action enregistrée.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th scope="col">Date</th><th scope="col">Action</th><th scope="col">Par</th><th scope="col">Détail</th></tr>
              </thead>
              <tbody>
                {data.map((j) => (
                  <tr key={j.id}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{dateHeure(j.date)}</td>
                    <td><Badge tone={ton(j.action)}>{LIBELLES[j.action] || j.action}</Badge></td>
                    <td>{j.auteur}</td>
                    <td className="muted">{j.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
