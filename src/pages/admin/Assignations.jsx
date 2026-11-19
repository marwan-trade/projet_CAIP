import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Card, Chips, ErreurChargement, PageHeader, PageSkeleton, Progress } from '../../components/ui.jsx';
import { dateCourte } from '../../format.js';
import { TONS, age } from '../conseiller/Demandes.jsx';
import { Assigner } from './Indicateurs.jsx';

export default function Assignations() {
  const { data, loading, error, recharger } = useAsync(api.demandesAdmin);
  const [filtre, setFiltre] = useState('Ouvertes');

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;

  const { demandes, conseillers } = data;
  const visibles = demandes.filter((d) =>
    filtre === 'Ouvertes' ? d.code !== 'cloturee' : filtre === 'En retard' ? d.enRetard : filtre === 'À assigner' ? d.code === 'recue' : d.code === 'cloturee',
  );

  return (
    <>
      <PageHeader eyebrow="Administration" title="Assignations" subtitle="Répartissez les demandes entre les conseillers selon leur charge." />

      <div className="grid-auto" style={{ '--min': '220px' }}>
        {conseillers.map((c, i) => (
          <Card key={c.id} className="rise" style={{ '--i': i }}>
            <div className="row" style={{ '--gap': '10px' }}>
              <Avatar initials={c.nom.replace(/^(M\.|Mme)\s+/, 'M').slice(0, 2).toUpperCase()} tone="navy" size={38} />
              <div className="stack" style={{ '--gap': '0px', flex: 1 }}>
                <strong>{c.nom}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{c.specialite || 'Conseiller'}{!c.actif && ' · désactivé'}</span>
              </div>
            </div>
            <Progress value={Math.round((c.charge / c.capacite) * 100)} label={`Charge de ${c.nom}`} />
            <span className="muted" style={{ fontSize: 13 }}>{c.charge} demande{c.charge > 1 ? 's' : ''} ouverte{c.charge > 1 ? 's' : ''} sur {c.capacite}</span>
          </Card>
        ))}
      </div>

      <Card className="rise">
        <div className="card__head">
          <h2 className="card__title">Demandes</h2>
          <Chips label="Filtrer" value={filtre} onChange={setFiltre} options={['Ouvertes', 'À assigner', 'En retard', 'Clôturées']} />
        </div>
        {visibles.length === 0 ? (
          <p className="muted">Aucune demande dans cette catégorie.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th scope="col">Candidat</th><th scope="col">Statut</th><th scope="col">Conseiller</th><th scope="col">Action</th></tr>
              </thead>
              <tbody>
                {visibles.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.nom}</strong>
                      <br /><span className="muted" style={{ fontSize: 13 }}>{d.objectif} · reçue le {dateCourte(d.date)}</span>
                    </td>
                    <td>
                      <Badge tone={TONS[d.statut]}>{d.statut}</Badge>
                      <br /><span className={`request__age${d.enRetard ? ' is-late' : ''}`}>{age(d)}</span>
                    </td>
                    <td>{d.conseiller || <span className="muted">—</span>}</td>
                    <td>
                      {d.code === 'cloturee' ? (
                        <span className="muted">Clôturée</span>
                      ) : (
                        <Assigner demande={d} conseillers={conseillers} onFait={recharger} libelle={d.conseillerId ? 'Réassigner' : 'Assigner'} />
                      )}
                    </td>
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
