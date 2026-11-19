import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Badge, Button, Card, ErreurChargement, Field, Notice, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

// Envoi d'un petit formulaire, avec erreurs par champ.
function useFormulaire(envoyer, apres) {
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setEnvoi(true);
    setErreurs({});
    try {
      await envoyer(Object.fromEntries(new FormData(form)));
      form.reset();
      await apres();
    } catch (err) {
      setErreurs({ ...err.champs, global: Object.keys(err.champs || {}).length ? '' : err.message });
    } finally {
      setEnvoi(false);
    }
  };
  return { erreurs, envoi, onSubmit };
}

function Modeles({ modeles, recharger, agir }) {
  const f = useFormulaire(api.creerModele, recharger);
  const [type, setType] = useState('cv');
  return (
    <div className="split">
      <Card className="rise" style={{ flex: '2 1 440px' }}>
        <h2 className="card__title">Modèles de CV et de lettres</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Modèle</th><th scope="col">Secteur</th><th scope="col">Visibilité</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {modeles.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.nom}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{m.type === 'cv' ? 'CV' : 'Lettre'} · {m.style}</span></td>
                  <td>{m.secteur}</td>
                  <td>
                    <button type="button" className="badge-toggle" aria-pressed={m.publie} onClick={() => agir(() => api.publierModele(m.id, !m.publie))} aria-label={`${m.nom} : ${m.publie ? 'publié, retirer' : 'retiré, publier'}`}>
                      <Badge tone={m.publie ? 'success' : 'neutral'}>{m.publie ? 'Publié' : 'Retiré'}</Badge>
                    </button>
                  </td>
                  <td className="table__action">
                    <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer ${m.nom}`} onClick={() => window.confirm(`Supprimer définitivement « ${m.nom} » ?`) && agir(() => api.supprimerModele(m.id))}>
                      <Icon name="trash" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card as="form" className="rise" onSubmit={f.onSubmit} noValidate style={{ flex: '1 1 300px' }}>
        <h2 className="card__title">Nouveau modèle</h2>
        <Field label="Type" as="select" name="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="cv">CV</option>
          <option value="lettre">Lettre de motivation</option>
        </Field>
        <Field label="Nom" name="nom" placeholder="Ex. CV Hôtellerie" error={f.erreurs.nom} />
        <Field label="Secteur" name="secteur" placeholder="Tous secteurs" />
        {type === 'cv' && (
          <Field label="Mise en page" as="select" name="style" defaultValue="classique">
            <option value="classique">Classique</option>
            <option value="colonne">Avec colonne</option>
          </Field>
        )}
        <Field
          label="Contenu"
          name="contenu"
          as="textarea"
          rows={7}
          hint="« # Titre » crée une rubrique. {{nom}}, {{email}}, {{telephone}} et {{poste}} sont remplacés par les informations du candidat."
        />
        {f.erreurs.global && <Notice tone="danger" icon="alert">{f.erreurs.global}</Notice>}
        <Button type="submit" icon="plus" disabled={f.envoi}>Publier le modèle</Button>
      </Card>
    </div>
  );
}

function Entretiens({ themes, recharger, agir }) {
  const f = useFormulaire(api.creerQuestion, recharger);
  return (
    <div className="split">
      <div className="stack" style={{ flex: '2 1 440px' }}>
        {themes.map((t) => (
          <Card key={t.id} className="rise">
            <div className="card__head"><h2 className="card__title">{t.label}</h2><span className="muted">{t.questions.length} question{t.questions.length > 1 ? 's' : ''}</span></div>
            <ul className="admin-list">
              {t.questions.map((q) => (
                <li key={q.id}>
                  <span className="stack" style={{ '--gap': '2px', flex: 1 }}>
                    <strong>{q.question}</strong>
                    <span className="muted" style={{ fontSize: 13 }}>{q.conseil}</span>
                  </span>
                  <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer « ${q.question} »`} onClick={() => window.confirm('Supprimer cette question ?') && agir(() => api.supprimerQuestion(q.id))}>
                    <Icon name="trash" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card as="form" className="rise" onSubmit={f.onSubmit} noValidate style={{ flex: '1 1 300px', alignSelf: 'flex-start' }}>
        <h2 className="card__title">Nouvelle question</h2>
        <Field label="Thème" as="select" name="themeId" error={f.erreurs.themeId}>
          {themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Field>
        <Field label="Question" name="question" error={f.erreurs.question} />
        <Field label="Ce que le recruteur cherche" name="attendu" as="textarea" rows={2} />
        <Field label="Conseil" name="conseil" as="textarea" rows={2} error={f.erreurs.conseil} />
        {f.erreurs.global && <Notice tone="danger" icon="alert">{f.erreurs.global}</Notice>}
        <Button type="submit" icon="plus" disabled={f.envoi}>Ajouter la question</Button>
      </Card>
    </div>
  );
}

function Partenaires({ partenaires, recharger, agir }) {
  const f = useFormulaire(api.creerPartenaire, recharger);
  return (
    <div className="split">
      <Card className="rise" style={{ flex: '2 1 440px' }}>
        <h2 className="card__title">Centres de formation partenaires</h2>
        <p className="muted" style={{ fontSize: 13 }}>Affichés sur la page d’accueil et sur la page de connexion.</p>
        <ul className="admin-list">
          {partenaires.map((p) => (
            <li key={p.id}>
              <Icon name="cap" size={20} className="text-electric" />
              <span className="stack" style={{ '--gap': '2px', flex: 1 }}>
                <strong>{p.nom}</strong>
                {p.site && <a href={p.site} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{p.site}</a>}
              </span>
              <button type="button" className="badge-toggle" aria-pressed={p.visible} onClick={() => agir(() => api.afficherPartenaire(p.id, !p.visible))}>
                <Badge tone={p.visible ? 'success' : 'neutral'}>{p.visible ? 'Affiché' : 'Masqué'}</Badge>
              </button>
              <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer ${p.nom}`} onClick={() => window.confirm(`Supprimer « ${p.nom} » ?`) && agir(() => api.supprimerPartenaire(p.id))}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card as="form" className="rise" onSubmit={f.onSubmit} noValidate style={{ flex: '1 1 300px', alignSelf: 'flex-start' }}>
        <h2 className="card__title">Ajouter un partenaire</h2>
        <Field label="Nom du centre" name="nom" error={f.erreurs.nom} />
        <Field label="Site web (facultatif)" name="site" placeholder="https://" error={f.erreurs.site} />
        {f.erreurs.global && <Notice tone="danger" icon="alert">{f.erreurs.global}</Notice>}
        <Button type="submit" icon="plus" disabled={f.envoi}>Ajouter</Button>
      </Card>
    </div>
  );
}

export default function Contenus() {
  const { data, loading, error, recharger } = useAsync(api.contenus);
  const [vue, setVue] = useState('modeles');
  const [erreur, setErreur] = useState('');

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;

  const agir = async (fn) => {
    setErreur('');
    try {
      await fn();
      await recharger();
    } catch (e) {
      setErreur(e.message);
    }
  };
  const props = { recharger, agir };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Contenus"
        subtitle="Ce que les candidats voient : modèles, questions d’entretien, formation, partenaires."
        actions={
          <Segmented
            label="Type de contenu"
            value={vue}
            onChange={setVue}
            options={[
              { value: 'modeles', label: 'Modèles' },
              { value: 'entretiens', label: 'Entretiens' },
              { value: 'formation', label: 'Formation' },
              { value: 'partenaires', label: 'Partenaires' },
            ]}
          />
        }
      />
      {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}
      {vue === 'modeles' && <Modeles modeles={data.modeles} {...props} />}
      {vue === 'entretiens' && <Entretiens themes={data.themes} {...props} />}
      {vue === 'partenaires' && <Partenaires partenaires={data.partenaires} {...props} />}
      {vue === 'formation' && (
        <Card className="rise">
          <h2 className="card__title">Modules de formation</h2>
          <ul className="admin-list">
            {data.modules.map((m) => (
              <li key={m.id}>
                <span className="module__num">{m.numero}</span>
                <strong style={{ flex: 1 }}>{m.titre}</strong>
                <span className="muted">{m.questions} questions de quiz</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: 13 }}>Les questions de quiz se modifient dans la base de données (table question_quiz).</p>
        </Card>
      )}
    </>
  );
}
