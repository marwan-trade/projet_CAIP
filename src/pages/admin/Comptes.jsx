import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useSession } from '../../session.jsx';
import { Avatar, Badge, Button, Card, Chips, ErreurChargement, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import { dateCourte, depuis } from '../../format.js';

const ROLES = { candidat: 'Candidat', conseiller: 'Conseiller', administrateur: 'Administrateur' };
const FILTRES = [
  { value: '', label: 'Tous' },
  { value: 'candidat', label: 'Candidats' },
  { value: 'conseiller', label: 'Conseillers' },
  { value: 'administrateur', label: 'Administrateurs' },
];

function NouveauCompte({ onCree }) {
  const [erreurs, setErreurs] = useState({});
  const [cree, setCree] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [role, setRole] = useState('conseiller');

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    setEnvoi(true);
    setErreurs({});
    try {
      const r = await api.creerCompte({ ...d, role });
      setCree({ email: d.email, mdp: r.motDePasseProvisoire });
      form.reset();
      onCree();
    } catch (err) {
      setErreurs({ ...err.champs, global: Object.keys(err.champs || {}).length ? '' : err.message });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Card as="form" className="rise" onSubmit={onSubmit} noValidate style={{ flex: '1 1 300px' }}>
      <h2 className="card__title">Ajouter un membre de l’équipe</h2>
      <p className="muted" style={{ fontSize: 13 }}>Les candidats créent eux-mêmes leur compte. Ici, vous ajoutez les conseillers et les administrateurs.</p>
      <Field label="Nom complet" name="nom" placeholder="Ex. Mme Hodan" error={erreurs.nom} />
      <Field label="Adresse e-mail" name="email" type="email" placeholder="prenom@caip.dj" error={erreurs.email} />
      <Field label="Rôle" as="select" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="conseiller">Conseiller</option>
        <option value="administrateur">Administrateur</option>
      </Field>
      {role === 'conseiller' && (
        <>
          <Field label="Spécialité" name="specialite" placeholder="Ex. Premier emploi, reconversion…" />
          <Field label="Demandes simultanées" name="capacite" type="number" min={1} max={30} defaultValue={8} />
        </>
      )}
      {erreurs.global && <Notice tone="danger" icon="alert">{erreurs.global}</Notice>}
      {cree && (
        <Notice tone="success" icon="lock" title="Compte créé">
          Transmettez ce mot de passe provisoire à {cree.email} : <code className="code">{cree.mdp}</code>. Il ne sera plus affiché. La personne pourra le changer avec « Mot de passe oublié ».
        </Notice>
      )}
      <Button type="submit" icon="plus" disabled={envoi}>{envoi ? 'Création…' : 'Créer le compte'}</Button>
    </Card>
  );
}

export default function Comptes() {
  const { utilisateur } = useSession();
  const [q, setQ] = useState('');
  const [recherche, setRecherche] = useState('');
  const [role, setRole] = useState('');
  const { data, loading, error, recharger } = useAsync(() => api.comptes(recherche, role), [recherche, role]);
  const [erreur, setErreur] = useState('');

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;

  const basculer = async (u) => {
    setErreur('');
    try {
      await api.majCompte(u.id, { actif: !u.actif });
      await recharger();
    } catch (e) {
      setErreur(e.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Comptes" subtitle="Candidats, conseillers et administrateurs de la plateforme." />

      <div className="split">
        <Card className="rise" style={{ flex: '2 1 480px' }}>
          <form className="row" onSubmit={(e) => { e.preventDefault(); setRecherche(q.trim()); }}>
            <label className="search" style={{ flex: '1 1 220px' }}>
              <span className="sr-only">Rechercher un compte</span>
              <Icon name="search" size={18} />
              <input type="search" placeholder="Nom ou e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <Button type="submit" variant="secondary">Rechercher</Button>
          </form>
          <Chips label="Filtrer par rôle" value={role} onChange={setRole} options={FILTRES} />
          {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}
          {loading && !data ? (
            <PageSkeleton />
          ) : data.length === 0 ? (
            <p className="muted">Aucun compte trouvé.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th scope="col">Personne</th><th scope="col">Rôle</th><th scope="col">Dernière connexion</th><th scope="col">Accès</th></tr>
                </thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id} className={u.actif ? '' : 'is-muted'}>
                      <td>
                        <span className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' }}>
                          <Avatar initials={u.initiales} size={34} tone={u.role === 'candidat' ? 'electric' : 'navy'} />
                          <span className="stack" style={{ '--gap': '0px' }}>
                            <strong>{u.nom}</strong>
                            <span className="muted" style={{ fontSize: 13 }}>{u.email}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        {ROLES[u.role]}
                        {u.specialite && <><br /><span className="muted" style={{ fontSize: 13 }}>{u.specialite}</span></>}
                      </td>
                      <td className="muted">{u.derniereConnexion ? depuis(u.derniereConnexion) : `Créé le ${dateCourte(u.creeLe)}`}</td>
                      <td>
                        {u.id === utilisateur?.id ? (
                          <Badge tone="info">Vous</Badge>
                        ) : (
                          <button type="button" className="badge-toggle" aria-pressed={u.actif} onClick={() => basculer(u)} aria-label={`${u.nom} : ${u.actif ? 'actif, désactiver' : 'désactivé, réactiver'}`}>
                            <Badge tone={u.actif ? 'success' : 'neutral'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <NouveauCompte onCree={recharger} />
      </div>
    </>
  );
}
