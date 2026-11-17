import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, Chips, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

const TONS = { Assignée: 'info', 'En cours': 'success', Clôturée: 'neutral' };
const SUIVANT = { Assignée: 'En cours', 'En cours': 'Clôturée', Clôturée: 'En cours' };
const ACTION = { Assignée: 'Prendre en charge', 'En cours': 'Clôturer la demande', Clôturée: 'Rouvrir' };

export default function Demandes() {
  const { data, loading } = useAsync(api.demandesConseiller);
  const [filtre, setFiltre] = useState('Toutes');
  const [selId, setSelId] = useState(1);
  const [statuts, setStatuts] = useState({});

  if (loading || !data) return <PageSkeleton />;

  const demandes = data.map((d) => {
    const statut = statuts[d.id] || d.statut;
    return { ...d, statut, enRetard: d.enRetard && statut === 'Assignée' };
  });
  const visibles = demandes.filter((d) => filtre === 'Toutes' || d.statut === filtre);
  const sel = demandes.find((d) => d.id === selId) || demandes[0];
  const enRetard = demandes.filter((d) => d.enRetard).length;

  return (
    <>
      <PageHeader eyebrow="Espace conseiller" title="Mes demandes" subtitle="Bonjour M. Ali · capacité : 8 demandes simultanées" />

      <div className="grid-auto kpis" style={{ '--min': '180px' }}>
        <Card className="kpi rise"><span className="kpi__label">Assignées</span><strong className="kpi__value">{demandes.filter((d) => d.statut !== 'Clôturée').length}</strong><span className="kpi__sub">sur 8 possibles</span></Card>
        <Card className="kpi rise" style={{ '--i': 1 }}><span className="kpi__label">À traiter aujourd’hui</span><strong className="kpi__value">2</strong><span className="kpi__sub">nouvelles depuis hier</span></Card>
        <Card className={`kpi rise${enRetard ? ' kpi--alert' : ''}`} style={{ '--i': 2 }}><span className="kpi__label">Sans réponse &gt; 48 h</span><strong className="kpi__value">{enRetard}</strong><span className="kpi__sub">alerte envoyée à l’administrateur</span></Card>
        <Card className="kpi rise" style={{ '--i': 3 }}><span className="kpi__label">Clôturées ce mois</span><strong className="kpi__value">12</strong><span className="kpi__sub">novembre 2026</span></Card>
      </div>

      <div className="split">
        <section className="stack" style={{ flex: '1 1 320px', '--gap': '12px' }} aria-label="Liste des demandes">
          <Chips
            label="Filtrer par statut"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: 'Toutes', label: 'Toutes' },
              { value: 'Assignée', label: 'Assignées' },
              { value: 'En cours', label: 'En cours' },
              { value: 'Clôturée', label: 'Clôturées' },
            ]}
          />
          {visibles.map((d) => (
            <button key={d.id} type="button" className={`request${d.id === sel.id ? ' is-selected' : ''}`} aria-pressed={d.id === sel.id} onClick={() => setSelId(d.id)}>
              <span className="card__head">
                <strong>{d.nom}</strong>
                <Badge tone={TONS[d.statut]}>{d.statut}</Badge>
              </span>
              <span className="muted">{d.objectif}</span>
              <span className={`request__age${d.enRetard ? ' is-late' : ''}`}>{d.age}</span>
            </button>
          ))}
        </section>

        <Card className="rise" style={{ flex: '2 1 420px', '--i': 2 }} aria-label={`Demande de ${sel.nom}`}>
          <div className="row" style={{ '--gap': '14px' }}>
            <Avatar initials={sel.initiales} size={52} />
            <div className="stack" style={{ '--gap': '2px', flex: '1 1 200px' }}>
              <h2 className="card__title" style={{ fontSize: 22 }}>{sel.nom}</h2>
              <span className="muted">Demande reçue le {sel.date}</span>
            </div>
            <Badge tone={TONS[sel.statut]}>{sel.statut}</Badge>
          </div>

          {sel.enRetard && (
            <Notice tone="danger" icon="alert">Sans réponse depuis plus de 48 h ouvrées. Répondez au candidat en priorité.</Notice>
          )}

          <div className="grid-auto" style={{ '--min': '180px', '--gap': '12px' }}>
            <div className="info-tile"><span>Situation</span>{sel.situation}</div>
            <div className="info-tile"><span>Objectif</span>{sel.objectif}</div>
            <div className="info-tile"><span>Disponibilités</span>{sel.dispo}</div>
          </div>

          <div className="stack" style={{ '--gap': '10px' }}>
            <h3 className="card__label">Documents partagés par le candidat</h3>
            {sel.document ? (
              <div className="file-row">
                <Icon name="doc" size={22} className="text-electric" />
                <span style={{ flex: '1 1 160px' }}>{sel.document}</span>
                <span className="muted">Dernier score : {sel.score} / 100</span>
                <Button variant="secondary" icon="eye">Consulter</Button>
              </div>
            ) : (
              <p className="muted">Aucun document partagé. Le candidat peut en partager depuis son espace.</p>
            )}
          </div>

          <Field as="textarea" rows={3} label="Répondre au candidat" placeholder="Votre message…" />
          <div className="row">
            <Button icon="send">Envoyer</Button>
            <Button variant="secondary" onClick={() => setStatuts((s) => ({ ...s, [sel.id]: SUIVANT[sel.statut] }))}>{ACTION[sel.statut]}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
