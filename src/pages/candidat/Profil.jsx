import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useLang } from '../../i18n.jsx';
import { useSession } from '../../session.jsx';
import { Badge, Button, Card, Checkbox, ErreurChargement, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import { dateCourte, taille } from '../../format.js';

export default function Profil() {
  const { lang, setLang } = useLang();
  const { definir } = useSession();
  const navigate = useNavigate();
  const { data, loading, error, recharger, setData } = useAsync(api.profil);
  const [enregistre, setEnregistre] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [aSupprimer, setASupprimer] = useState(null);
  const [suppressionCompte, setSuppressionCompte] = useState(false);
  const [erreurCompte, setErreurCompte] = useState('');
  const [erreur, setErreur] = useState('');

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;
  const { candidat, documents } = data;

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreurs({});
    setEnregistre(false);
    try {
      const champs = Object.fromEntries(new FormData(e.currentTarget));
      const u = await api.majProfil({ ...champs, langue: lang });
      definir(u);
      setEnregistre(true);
    } catch (err) {
      setErreurs({ ...err.champs, global: Object.keys(err.champs || {}).length ? '' : err.message });
    } finally {
      setEnvoi(false);
    }
  };

  const changerConsentement = async (e) => {
    const ok = e.target.checked;
    setData((d) => ({ ...d, candidat: { ...d.candidat, consentementAnalyse: ok ? new Date().toISOString() : null } }));
    await api.majProfil({ consentement: ok }).catch((err) => setErreur(err.message));
  };

  const supprimerDocument = async () => {
    try {
      await api.supprimerDocument(aSupprimer.id);
      setData((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== aSupprimer.id) }));
      setASupprimer(null);
    } catch (err) {
      setErreur(err.message);
    }
  };

  const partager = async (doc) => {
    setData((d) => ({ ...d, documents: d.documents.map((x) => (x.id === doc.id ? { ...x, partage: !x.partage } : x)) }));
    await api.partagerDocument(doc.id, !doc.partage).catch(recharger);
  };

  const supprimerCompte = async (e) => {
    e.preventDefault();
    setErreurCompte('');
    try {
      await api.supprimerCompte(String(new FormData(e.currentTarget).get('password') || ''));
      definir(null);
      navigate('/', { replace: true });
    } catch (err) {
      setErreurCompte(err.champs?.password || err.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Mon compte" title="Profil et données" subtitle="Gérez vos informations, vos documents et vos droits." />

      <div className="split">
        <Card as="form" className="rise" style={{ flex: '1 1 340px', '--i': 1 }} onSubmit={enregistrer} noValidate>
          <h2 className="card__title">Mes informations</h2>
          <Field label="Nom complet" name="nom" defaultValue={candidat.nom} autoComplete="name" error={erreurs.nom} />
          <Field label="Adresse e-mail" name="email" type="email" defaultValue={candidat.email} autoComplete="email" error={erreurs.email} />
          <Field label="Téléphone" name="telephone" type="tel" defaultValue={candidat.telephone || ''} autoComplete="tel" />
          <Field label="Secteur visé" name="secteur" defaultValue={candidat.secteur || ''} />
          <Field label="Poste visé" name="posteVise" defaultValue={candidat.posteVise || ''} />
          <Field label="Langue de l’interface" as="select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </Field>
          {erreurs.global && <Notice tone="danger" icon="alert">{erreurs.global}</Notice>}
          <div className="row">
            <Button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
            {enregistre && <span className="row text-success" role="status" style={{ '--gap': '6px' }}><Icon name="check" size={18} stroke={2.5} />Enregistré</span>}
          </div>
        </Card>

        <div className="stack" style={{ flex: '2 1 440px' }}>
          <Card className="rise" style={{ '--i': 2 }}>
            <h2 className="card__title">Mes documents</h2>
            <p className="muted" style={{ fontSize: 13 }}>Conservés 12 mois au maximum. Vous seul y avez accès, sauf partage avec votre conseiller.</p>
            {documents.length === 0 ? (
              <p className="muted">Aucun document. <a href="/app/analyse/nouvelle" onClick={(e) => { e.preventDefault(); navigate('/app/analyse/nouvelle'); }}>Déposer mon CV</a></p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th scope="col">Fichier</th><th scope="col">Déposé le</th><th scope="col">Visibilité</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <a href={api.lienDocument(d.id)} target="_blank" rel="noreferrer">{d.nom}</a>
                          <br /><span className="muted" style={{ fontSize: 12 }}>{d.type === 'cv' ? 'CV' : 'Lettre'} · {taille(d.taille)}</span>
                        </td>
                        <td className="muted">{dateCourte(d.date)}</td>
                        <td>
                          <button type="button" className="badge-toggle" aria-pressed={d.partage} onClick={() => partager(d)} aria-label={`${d.nom} : ${d.partage ? 'partagé, rendre privé' : 'privé, partager avec mon conseiller'}`}>
                            <Badge tone={d.partage ? 'success' : 'neutral'}>{d.partage ? 'Partagé' : 'Privé'}</Badge>
                          </button>
                        </td>
                        <td className="table__action">
                          <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer ${d.nom}`} onClick={() => setASupprimer(d)}>
                            <Icon name="trash" size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {aSupprimer && (
              <Notice
                tone="danger"
                icon="alert"
                title={`Supprimer « ${aSupprimer.nom} » ?`}
                action={
                  <div className="row" style={{ '--gap': '8px' }}>
                    <Button variant="secondary" onClick={() => setASupprimer(null)}>Annuler</Button>
                    <Button variant="danger" onClick={supprimerDocument}>Supprimer</Button>
                  </div>
                }
              >
                Le fichier et ses analyses seront effacés définitivement.
              </Notice>
            )}
            {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}
          </Card>

          <Card className="rise" style={{ '--i': 3 }}>
            <h2 className="card__title">Confidentialité et droits</h2>
            <Checkbox
              checked={!!candidat.consentementAnalyse}
              onChange={changerConsentement}
              label={candidat.consentementAnalyse ? `J’accepte que mes documents soient analysés (consentement donné le ${dateCourte(candidat.consentementAnalyse)})` : 'J’accepte que mes documents soient analysés'}
            />
            <div className="row">
              <Button variant="secondary" icon="download" href={api.lienExport()} download>Exporter mes données</Button>
              <Button variant="danger" icon="trash" onClick={() => setSuppressionCompte(true)}>Supprimer mon compte</Button>
            </div>
            {suppressionCompte && (
              <form className="danger-zone" onSubmit={supprimerCompte}>
                <strong>Supprimer définitivement votre compte ?</strong>
                <span className="muted">Vos documents, analyses et messages seront effacés. Confirmez avec votre mot de passe.</span>
                <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" error={erreurCompte} />
                <div className="row" style={{ '--gap': '8px' }}>
                  <Button variant="secondary" onClick={() => setSuppressionCompte(false)}>Annuler</Button>
                  <Button type="submit" variant="danger">Supprimer mon compte</Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
