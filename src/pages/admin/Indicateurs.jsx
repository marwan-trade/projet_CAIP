import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Badge, Button, Card, ErreurChargement, Notice, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';
import { depuis, jourMois } from '../../format.js';

function etat(ok) {
  if (ok === null) return { label: 'En cours', tone: 'info' };
  return ok ? { label: 'Atteint', tone: 'success' } : { label: 'Sous la cible', tone: 'warn' };
}

// Ligne « assigner » : choix du conseiller puis envoi.
export function Assigner({ demande, conseillers, onFait, libelle = 'Assigner' }) {
  const libres = conseillers.filter((c) => c.actif && c.id !== demande.conseillerId);
  const [choix, setChoix] = useState(() => (libres.find((c) => c.charge < c.capacite) || libres[0])?.id || '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const go = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      await api.assigner(demande.id, Number(choix));
      await onFait();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <div className="stack" style={{ '--gap': '6px' }}>
      <div className="row assigner" style={{ '--gap': '8px' }}>
        <select className="field__control field__control--sm" aria-label={`Conseiller pour ${demande.nom}`} value={choix} onChange={(e) => setChoix(e.target.value)}>
          {libres.map((c) => (
            <option key={c.id} value={c.id} disabled={c.charge >= c.capacite}>{c.nom} ({c.charge}/{c.capacite})</option>
          ))}
        </select>
        <Button onClick={go} disabled={!choix || envoi}>{libelle}</Button>
      </div>
      {erreur && <span className="field__hint field__hint--error">{erreur}</span>}
    </div>
  );
}

export default function Indicateurs() {
  const [periode, setPeriode] = useState('30');
  const { data, loading, error, recharger } = useAsync(() => api.indicateurs(periode), [periode]);

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading && !data) return <PageSkeleton />;
  const retard = data.enRetard;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Indicateurs"
        subtitle="Suivi des objectifs du cahier des charges, calculé sur les données de la plateforme"
        actions={<Segmented label="Période" value={periode} onChange={setPeriode} options={[{ value: '7', label: '7 jours' }, { value: '30', label: '30 jours' }, { value: '90', label: '90 jours' }]} />}
      />

      {retard.length > 0 && (
        <Notice
          tone="danger"
          icon="alert"
          title={`${retard.length} demande${retard.length > 1 ? 's' : ''} sans réponse depuis plus de 48 h`}
          action={<Button variant="danger" to="/admin/assignations">Réassigner</Button>}
        >
          {retard.map((d) => `${d.nom}, suivie par ${d.conseiller} depuis le ${jourMois(d.assigneeLe)}`).join(' · ')}
        </Notice>
      )}

      <div className="grid-auto" style={{ '--min': '230px', '--gap': '16px' }}>
        {data.indicateurs.map((d, i) => {
          const e = etat(d.ok);
          return (
            <Card key={d.label} className="kpi rise" style={{ '--i': i }}>
              <span className="kpi__label">{d.label}</span>
              <strong className="kpi__value">{d.valeur}</strong>
              {d.note && <span className="kpi__sub">{d.note}</span>}
              <span className="kpi__foot">
                <span className="kpi__sub">Cible : {d.cible}</span>
                <Badge tone={e.tone}>{d.valeur === '—' ? 'Pas encore de données' : e.label}</Badge>
              </span>
            </Card>
          );
        })}
      </div>

      <div className="split">
        <Card className="rise" style={{ flex: '2 1 420px', '--i': 2 }}>
          <div className="card__head">
            <h2 className="card__title">Demandes à assigner</h2>
            <Button variant="outline" to="/admin/assignations" iconRight="chevRight">Toutes les demandes</Button>
          </div>
          {data.aAssigner.length === 0 ? (
            <p className="muted">Aucune demande en attente. Bravo !</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th scope="col">Candidat</th><th scope="col">Reçue</th><th scope="col">Conseiller</th></tr>
                </thead>
                <tbody>
                  {data.aAssigner.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.nom}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{r.objectif}</span></td>
                      <td>{depuis(r.date)}</td>
                      <td><Assigner demande={r} conseillers={data.conseillers} onFait={recharger} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="rise" style={{ flex: '1 1 280px', '--i': 3 }}>
          <h2 className="card__title">Contenus publiés</h2>
          <dl className="counts">
            {data.contenus.map(([label, n]) => (
              <div key={label}><dt>{label}</dt><dd>{n}</dd></div>
            ))}
          </dl>
          <Button icon="plus" to="/admin/contenus">Publier un contenu</Button>
        </Card>
      </div>
    </>
  );
}
