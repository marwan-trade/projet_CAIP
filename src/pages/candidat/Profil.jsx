import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useLang } from '../../i18n.jsx';
import { Badge, Button, Card, Checkbox, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

export default function Profil() {
  const { lang, setLang } = useLang();
  const { data, loading } = useAsync(api.profil);
  const [enregistre, setEnregistre] = useState(false);
  const [aSupprimer, setASupprimer] = useState(null);
  const [supprimes, setSupprimes] = useState([]);

  if (loading || !data) return <PageSkeleton />;
  const { candidat } = data;
  const documents = data.documents.filter((d) => !supprimes.includes(d.nom));

  return (
    <>
      <PageHeader eyebrow="Mon compte" title="Profil et données" subtitle="Gérez vos informations, vos documents et vos droits." />

      <div className="split">
        <Card
          as="form"
          className="rise"
          style={{ flex: '1 1 340px', '--i': 1 }}
          onSubmit={(e) => { e.preventDefault(); setEnregistre(true); }}
        >
          <h2 className="card__title">Mes informations</h2>
          <Field label="Nom complet" defaultValue={`${candidat.prenom} ${candidat.nom}`} autoComplete="name" />
          <Field label="Adresse e-mail" type="email" defaultValue={candidat.email} autoComplete="email" />
          <Field label="Téléphone" type="tel" defaultValue={candidat.telephone} autoComplete="tel" />
          <Field label="Secteur visé" defaultValue={candidat.secteur} />
          <Field label="Langue de l’interface" as="select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </Field>
          <div className="row">
            <Button type="submit">Enregistrer</Button>
            {enregistre && <span className="row text-success" role="status" style={{ '--gap': '6px' }}><Icon name="check" size={18} stroke={2.5} />Enregistré</span>}
          </div>
        </Card>

        <div className="stack" style={{ flex: '2 1 440px' }}>
          <Card className="rise" style={{ '--i': 2 }}>
            <h2 className="card__title">Mes documents</h2>
            <p className="muted" style={{ fontSize: 13 }}>Conservés 12 mois au maximum. Vous seul y avez accès, sauf partage avec votre conseiller.</p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th scope="col">Fichier</th><th scope="col">Déposé le</th><th scope="col">Visibilité</th><th scope="col"><span className="sr-only">Action</span></th></tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.nom}>
                      <td>{d.nom}</td>
                      <td className="muted">{d.date}</td>
                      <td><Badge tone={d.partage ? 'success' : 'neutral'}>{d.partage ? 'Partagé' : 'Privé'}</Badge></td>
                      <td className="table__action">
                        <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer ${d.nom}`} onClick={() => setASupprimer(d.nom)}>
                          <Icon name="trash" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {aSupprimer && (
              <Notice
                tone="danger"
                icon="alert"
                title={`Supprimer « ${aSupprimer} » ?`}
                action={
                  <div className="row" style={{ '--gap': '8px' }}>
                    <Button variant="secondary" onClick={() => setASupprimer(null)}>Annuler</Button>
                    <Button variant="danger" onClick={() => { setSupprimes((s) => [...s, aSupprimer]); setASupprimer(null); }}>Supprimer</Button>
                  </div>
                }
              >
                Le fichier et ses analyses seront effacés définitivement.
              </Notice>
            )}
          </Card>

          <Card className="rise" style={{ '--i': 3 }}>
            <h2 className="card__title">Confidentialité et droits</h2>
            <Checkbox defaultChecked label={`J’accepte que mes documents soient analysés (consentement donné le ${candidat.consentementAnalyse})`} />
            <div className="row">
              <Button variant="secondary" icon="download">Exporter mes données</Button>
              <Button variant="danger" icon="trash">Supprimer mon compte</Button>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>La suppression est effective sous 30 jours. Vous recevrez une confirmation par e-mail.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
