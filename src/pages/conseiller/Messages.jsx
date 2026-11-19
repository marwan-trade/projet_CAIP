import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Card, ErreurChargement, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import { FilMessages, FormMessage } from '../candidat/Accompagnement.jsx';
import { age, TONS } from './Demandes.jsx';

function Conversation({ demande, onChange }) {
  const { data: messages, error, recharger, setData } = useAsync(() => api.messages(demande.id), [demande.id]);

  // Nouveaux messages du candidat : vérification toutes les 20 secondes.
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === 'visible' && recharger(), 20000);
    return () => clearInterval(id);
  }, [recharger]);

  const envoyer = async (t) => {
    setData(await api.envoyerMessage(demande.id, t));
    onChange();
  };

  return (
    <Card className="chat rise" style={{ flex: '2 1 440px' }}>
      <div className="chat__head">
        <Avatar initials={demande.initiales} size={46} />
        <div className="stack" style={{ '--gap': '0px', flex: 1 }}>
          <strong>{demande.nom}</strong>
          <span className="muted" style={{ fontSize: 13 }}>{demande.objectif}</span>
        </div>
        <Badge tone={TONS[demande.statut]}>{demande.statut}</Badge>
      </div>
      {error && <ErreurChargement error={error} onRetry={recharger} />}
      {messages ? <FilMessages messages={messages} nomAutre={demande.nom} /> : <div className="skeleton" style={{ height: 240 }} />}
      <FormMessage onEnvoyer={envoyer} disabled={demande.code === 'cloturee'} raison="Demande clôturée : rouvrez-la depuis « Demandes » pour écrire." />
    </Card>
  );
}

export default function Messages() {
  const { data, loading, error, recharger } = useAsync(api.demandesConseiller);
  const [params, setParams] = useSearchParams();
  const [selId, setSelId] = useState(Number(params.get('demande')) || null);

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;
  const demandes = data.demandes;
  const sel = demandes.find((d) => d.id === selId) || demandes[0];

  const choisir = (id) => {
    setSelId(id);
    setParams({ demande: String(id) }, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="Espace conseiller" title="Messages" subtitle="Vos conversations avec les candidats que vous accompagnez." />
      {!sel ? (
        <Card className="empty">
          <Icon name="chat" size={36} />
          <strong>Aucune conversation.</strong>
          <span className="muted">Les conversations apparaissent dès qu’une demande vous est assignée.</span>
        </Card>
      ) : (
        <div className="split">
          <nav className="stack" style={{ flex: '1 1 280px', '--gap': '10px' }} aria-label="Conversations">
            {demandes.map((d) => (
              <button key={d.id} type="button" className={`request${d.id === sel.id ? ' is-selected' : ''}`} aria-pressed={d.id === sel.id} onClick={() => choisir(d.id)}>
                <span className="card__head">
                  <span className="row" style={{ '--gap': '10px' }}>
                    <Avatar initials={d.initiales} size={34} />
                    <strong>{d.nom}</strong>
                  </span>
                  {d.nonLus > 0 && <Badge tone="danger">{d.nonLus}</Badge>}
                </span>
                <span className={`request__age${d.enRetard ? ' is-late' : ''}`}>{age(d)}</span>
              </button>
            ))}
          </nav>
          <Conversation key={sel.id} demande={sel} onChange={recharger} />
        </div>
      )}
    </>
  );
}
