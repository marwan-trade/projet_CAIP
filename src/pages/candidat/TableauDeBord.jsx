import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, Notice, PageHeader, PageSkeleton, Progress } from '../../components/ui.jsx';
import { DoorSteps, VersionBars } from '../../components/Progressions.jsx';
import { Swoosh } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';
import { dateCourte } from '../../format.js';

export default function TableauDeBord() {
  const { data, loading, error } = useAsync(api.tableauDeBord);
  if (error && !data) return <Notice tone="danger" icon="alert">{error.message}</Notice>;
  if (loading || !data) return <PageSkeleton />;

  const { candidat, parcours, analyses, modules, accompagnement, recommandationsPrioritaires } = data;
  const faites = parcours.filter((p) => p.etat === 'fait').length;
  const pct = Math.round((faites / parcours.length) * 100);
  const suivante = parcours.find((p) => p.etat !== 'fait');
  const valides = modules.filter((m) => m.etat === 'valide').length;
  const moduleEnCours = modules.find((m) => m.etat === 'en-cours') || modules.find((m) => m.etat === 'a-venir');
  const [derniere, precedente] = analyses;
  const statut = accompagnement?.statut;

  return (
    <>
      <PageHeader
        eyebrow="Tableau de bord"
        title={`Bonjour, ${candidat.prenom}`}
        subtitle={`Vous avez ouvert ${faites} portes sur ${parcours.length}.${suivante ? ` Prochaine porte : ${suivante.label}.` : ''}`}
        actions={<Button to="/app/analyse/nouvelle" icon="upload">Nouvelle analyse</Button>}
      />

      <div className="split">
        <Card tone="night" className="journey rise" style={{ flex: '2 1 420px', '--i': 1 }}>
          <Swoosh />
          <div className="card__head">
            <h2 className="card__title">Mon parcours</h2>
            <span className="journey__pct">{pct} %</span>
          </div>
          <Progress value={pct} tone="dark" size="lg" label="Progression du parcours" />
          <DoorSteps steps={parcours} />
        </Card>

        <Card className="next-action rise" style={{ flex: '1 1 260px', '--i': 2 }}>
          <span className="eyebrow eyebrow--warn">Prochaine action</span>
          {derniere ? (
            <>
              <strong className="next-action__title">
                {recommandationsPrioritaires > 0
                  ? `Corrigez ${recommandationsPrioritaires > 1 ? `les ${recommandationsPrioritaires} recommandations prioritaires` : 'la recommandation prioritaire'} de votre CV`
                  : 'Toutes vos recommandations prioritaires sont corrigées'}
              </strong>
              <span className="muted">Dernière analyse le {dateCourte(derniere.date)}</span>
              <Button to="/app/analyse/rapport" block iconRight="chevRight">Voir mon rapport</Button>
            </>
          ) : (
            <>
              <strong className="next-action__title">Faites analyser votre CV</strong>
              <span className="muted">Partez d’un modèle ou déposez votre CV : vous recevez un score et des recommandations.</span>
              <Button to="/app/analyse/nouvelle" block iconRight="chevRight">Déposer mon CV</Button>
            </>
          )}
        </Card>
      </div>

      <div className="grid-auto" style={{ '--min': '230px' }}>
        <Card className="rise" style={{ '--i': 3 }}>
          <h2 className="card__label">Score de mon CV</h2>
          {derniere ? (
            <>
              <div className="big-number">
                {derniere.score}<span>/ 100</span>
                {precedente && (
                  <Badge tone={derniere.score >= precedente.score ? 'success' : 'warn'}>
                    {derniere.score >= precedente.score ? '+' : ''}{derniere.score - precedente.score}
                  </Badge>
                )}
              </div>
              <VersionBars items={analyses.slice(0, 2).reverse().map((a) => ({ label: `v${a.version}`, value: a.score }))} />
            </>
          ) : (
            <>
              <div className="big-number">—<span>/ 100</span></div>
              <Link to="/app/analyse/nouvelle" className="link-arrow">Lancer ma première analyse <Icon name="chevRight" size={16} /></Link>
            </>
          )}
        </Card>

        <Card className="rise" style={{ '--i': 4 }}>
          <h2 className="card__label">Formation</h2>
          <div className="big-number">{valides}<span>modules sur {modules.length}</span></div>
          <div className="segments" aria-hidden="true">
            {modules.map((m) => <span key={m.n} className={`segments__item segments__item--${m.etat}`} />)}
          </div>
          {moduleEnCours && (
            <Link to="/app/formation" className="link-arrow">
              {moduleEnCours.etat === 'en-cours' ? 'Reprendre' : 'Commencer'} le module {moduleEnCours.n} <Icon name="chevRight" size={16} />
            </Link>
          )}
        </Card>

        <Card className="rise" style={{ '--i': 5 }}>
          <h2 className="card__label">Accompagnement</h2>
          {accompagnement?.conseiller ? (
            <div className="row">
              <Avatar initials={accompagnement.conseiller.initiales} tone="navy" />
              <div className="stack" style={{ '--gap': '2px' }}>
                <strong>{accompagnement.conseiller.nom}</strong>
                <span className="muted" style={{ fontSize: 13 }}>Conseiller · {accompagnement.conseiller.specialite}</span>
              </div>
            </div>
          ) : (
            <span className="muted">{accompagnement ? 'Votre demande attend un conseiller.' : 'Un conseiller peut relire votre CV et vous préparer à l’entretien.'}</span>
          )}
          {statut && <Badge tone={statut === 'En cours' ? 'success' : 'info'}>{statut}</Badge>}
          <Link to="/app/accompagnement" className="link-arrow">
            {accompagnement ? 'Ouvrir la conversation' : 'Demander un accompagnement'} <Icon name="chevRight" size={16} />
          </Link>
        </Card>
      </div>

      {analyses.length > 0 && (
      <Card className="rise" style={{ '--i': 6 }}>
        <div className="card__head">
          <h2 className="card__title">Historique des analyses</h2>
          <Link to="/app/analyse/rapport" className="link-arrow">Comparer deux versions</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Document</th>
                <th scope="col">Poste visé</th>
                <th scope="col">Score</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id}>
                  <td>{dateCourte(a.date)}</td>
                  <td>{a.document}</td>
                  <td>{a.poste}</td>
                  <td><strong>{a.score}</strong></td>
                  <td className="table__action"><Link to={`/app/analyse/rapport?id=${a.id}`}>Voir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </>
  );
}
