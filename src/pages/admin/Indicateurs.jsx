import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Badge, Button, Card, Notice, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';

function etat(ok) {
  if (ok === null) return { label: 'En cours', tone: 'info' };
  return ok ? { label: 'Atteint', tone: 'success' } : { label: 'Sous la cible', tone: 'warn' };
}

export default function Indicateurs() {
  const { data, loading } = useAsync(api.indicateurs);
  const [periode, setPeriode] = useState('30');
  const [assignees, setAssignees] = useState({});

  if (loading || !data) return <PageSkeleton />;
  const valeurs = data.valeurs[periode];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Indicateurs"
        subtitle="Suivi des objectifs du cahier des charges · données d’exemple"
        actions={<Segmented label="Période" value={periode} onChange={setPeriode} options={data.periodes.map((p) => ({ value: p.id, label: p.label }))} />}
      />

      <Notice
        tone="danger"
        icon="alert"
        title="1 demande sans réponse depuis plus de 48 h ouvrées"
        action={<Button variant="danger">Réassigner</Button>}
      >
        Hassan Omar, assignée à M. Ali le 7 nov.
      </Notice>

      <div className="grid-auto" style={{ '--min': '230px', '--gap': '16px' }}>
        {data.definitions.map((d, i) => {
          const [valeur, ok] = valeurs[i];
          const e = etat(ok);
          return (
            <Card key={d.label} className="kpi rise" style={{ '--i': i }}>
              <span className="kpi__label">{d.label}</span>
              <strong className="kpi__value">{valeur}</strong>
              <span className="kpi__foot">
                <span className="kpi__sub">Cible : {d.cible}</span>
                <Badge tone={e.tone}>{e.label}</Badge>
              </span>
            </Card>
          );
        })}
      </div>

      <div className="split">
        <Card className="rise" style={{ flex: '2 1 420px', '--i': 2 }}>
          <h2 className="card__title">Demandes à assigner</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th scope="col">Candidat</th><th scope="col">Reçue</th><th scope="col">Conseiller</th><th scope="col"><span className="sr-only">Action</span></th></tr>
              </thead>
              <tbody>
                {data.aAssigner.map((r) => (
                  <tr key={r.nom}>
                    <td><strong>{r.nom}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{r.besoin}</span></td>
                    <td>{r.recue}</td>
                    <td>
                      <select className="field__control field__control--sm" aria-label={`Conseiller pour ${r.nom}`} disabled={!!assignees[r.nom]}>
                        {data.conseillers.map((c) => <option key={c.nom}>{c.nom} ({c.charge}/8)</option>)}
                      </select>
                    </td>
                    <td className="table__action">
                      {assignees[r.nom]
                        ? <Badge tone="success">Assignée</Badge>
                        : <Button onClick={() => setAssignees((a) => ({ ...a, [r.nom]: true }))}>Assigner</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rise" style={{ flex: '1 1 280px', '--i': 3 }}>
          <h2 className="card__title">Contenus publiés</h2>
          <dl className="counts">
            {data.contenus.map(([label, n]) => (
              <div key={label}><dt>{label}</dt><dd>{n}</dd></div>
            ))}
          </dl>
          <Button icon="plus">Publier un contenu</Button>
        </Card>
      </div>
    </>
  );
}
