import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, PageHeader, PageSkeleton, Progress } from '../../components/ui.jsx';
import { DoorSteps, VersionBars } from '../../components/Progressions.jsx';
import { Swoosh } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';

export default function TableauDeBord() {
  const { data, loading } = useAsync(api.tableauDeBord);
  if (loading || !data) return <PageSkeleton />;

  const { candidat, parcours, analyses, modules, accompagnement } = data;
  const faites = parcours.filter((p) => p.etat === 'fait').length;
  const pct = Math.round((faites / parcours.length) * 100);
  const valides = modules.filter((m) => m.etat === 'valide').length;
  const [derniere, precedente] = analyses;

  return (
    <>
      <PageHeader
        eyebrow="Tableau de bord"
        title={`Bonjour, ${candidat.prenom}`}
        subtitle={`Vous avez ouvert ${faites} portes sur ${parcours.length}. La suivante : l’entretien.`}
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
          <strong className="next-action__title">Corrigez les 3 recommandations prioritaires de votre CV</strong>
          <span className="muted">Dernière analyse le {derniere.date}</span>
          <Button to="/app/analyse/rapport" block iconRight="chevRight">Voir mon rapport</Button>
        </Card>
      </div>

      <div className="grid-auto" style={{ '--min': '230px' }}>
        <Card className="rise" style={{ '--i': 3 }}>
          <h2 className="card__label">Score de mon CV</h2>
          <div className="big-number">
            {derniere.score}<span>/ 100</span>
            <Badge tone="success">+{derniere.score - precedente.score}</Badge>
          </div>
          <VersionBars items={[{ label: 'v1', value: precedente.score }, { label: 'v2', value: derniere.score }]} />
        </Card>

        <Card className="rise" style={{ '--i': 4 }}>
          <h2 className="card__label">Formation</h2>
          <div className="big-number">{valides}<span>modules sur {modules.length}</span></div>
          <div className="segments" aria-hidden="true">
            {modules.map((m) => <span key={m.n} className={`segments__item segments__item--${m.etat}`} />)}
          </div>
          <Link to="/app/formation" className="link-arrow">Reprendre le module 3 <Icon name="chevRight" size={16} /></Link>
        </Card>

        <Card className="rise" style={{ '--i': 5 }}>
          <h2 className="card__label">Accompagnement</h2>
          <div className="row">
            <Avatar initials={accompagnement.conseiller.initiales} tone="navy" />
            <div className="stack" style={{ '--gap': '2px' }}>
              <strong>{accompagnement.conseiller.nom}</strong>
              <span className="muted" style={{ fontSize: 13 }}>Rendez-vous jeudi 10 h</span>
            </div>
          </div>
          <Badge tone="success">En cours</Badge>
          <Link to="/app/accompagnement" className="link-arrow">Ouvrir la conversation <Icon name="chevRight" size={16} /></Link>
        </Card>
      </div>

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
                  <td>{a.date}</td>
                  <td>{a.document}</td>
                  <td>{a.poste}</td>
                  <td><strong>{a.score}</strong></td>
                  <td className="table__action"><Link to="/app/analyse/rapport">Voir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
