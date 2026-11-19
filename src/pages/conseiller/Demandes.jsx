import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, Chips, ErreurChargement, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import { dateCourte, depuis } from '../../format.js';

export const TONS = { Reçue: 'info', Assignée: 'info', 'En cours': 'success', Clôturée: 'neutral' };
const SUIVANT = { assignee: 'en_cours', en_cours: 'cloturee', cloturee: 'en_cours' };
const ACTION = { assignee: 'Prendre en charge', en_cours: 'Clôturer la demande', cloturee: 'Rouvrir' };

export function age(d) {
  if (d.enRetard) return `Sans réponse depuis ${depuis(d.attendDepuis).replace('il y a ', '')}`;
  if (d.code === 'cloturee') return 'Clôturée';
  if (d.dernierMessage) return `Dernier message ${depuis(d.dernierMessage)}`;
  return `Reçue ${depuis(d.assigneeLe || d.date)}`;
}

export default function Demandes() {
  const { data, loading, error, recharger } = useAsync(api.demandesConseiller);
  const [filtre, setFiltre] = useState('Toutes');
  const [selId, setSelId] = useState(null);
  const [reponse, setReponse] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [info, setInfo] = useState(null);

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;

  const { demandes, kpis, conseiller } = data;
  const visibles = demandes.filter((d) => filtre === 'Toutes' || d.statut === filtre);
  const sel = demandes.find((d) => d.id === selId) || visibles[0] || demandes[0];

  const agir = async (fn, message) => {
    setEnvoi(true);
    setInfo(null);
    try {
      await fn();
      await recharger();
      setInfo({ tone: 'success', texte: message });
    } catch (e) {
      setInfo({ tone: 'danger', texte: e.message });
    } finally {
      setEnvoi(false);
    }
  };

  const repondre = () =>
    agir(async () => {
      await api.envoyerMessage(sel.id, reponse.trim());
      setReponse('');
    }, `Message envoyé à ${sel.nom}.`);

  return (
    <>
      <PageHeader eyebrow="Espace conseiller" title="Mes demandes" subtitle={`Bonjour ${conseiller.nom} · capacité : ${conseiller.capacite} demandes simultanées`} />

      <div className="grid-auto kpis" style={{ '--min': '180px' }}>
        <Card className="kpi rise"><span className="kpi__label">Assignées</span><strong className="kpi__value">{kpis.ouvertes}</strong><span className="kpi__sub">sur {conseiller.capacite} possibles</span></Card>
        <Card className="kpi rise" style={{ '--i': 1 }}><span className="kpi__label">À traiter</span><strong className="kpi__value">{kpis.aTraiter}</strong><span className="kpi__sub">nouvelles ou messages non lus</span></Card>
        <Card className={`kpi rise${kpis.enRetard ? ' kpi--alert' : ''}`} style={{ '--i': 2 }}><span className="kpi__label">Sans réponse &gt; 48 h</span><strong className="kpi__value">{kpis.enRetard}</strong><span className="kpi__sub">signalées à l’administrateur</span></Card>
        <Card className="kpi rise" style={{ '--i': 3 }}><span className="kpi__label">Clôturées ce mois</span><strong className="kpi__value">{kpis.clotureesCeMois}</strong><span className="kpi__sub">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></Card>
      </div>

      {demandes.length === 0 ? (
        <Card className="empty">
          <Icon name="inbox" size={36} />
          <strong>Aucune demande pour le moment.</strong>
          <span className="muted">L’administrateur vous assignera des candidats selon votre spécialité.</span>
        </Card>
      ) : (
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
            {visibles.length === 0 && <p className="muted">Aucune demande avec ce statut.</p>}
            {visibles.map((d) => (
              <button key={d.id} type="button" className={`request${d.id === sel.id ? ' is-selected' : ''}`} aria-pressed={d.id === sel.id} onClick={() => { setSelId(d.id); setInfo(null); }}>
                <span className="card__head">
                  <strong>{d.nom}</strong>
                  <span className="row" style={{ '--gap': '6px' }}>
                    {d.nonLus > 0 && <Badge tone="danger">{d.nonLus} nouveau{d.nonLus > 1 ? 'x' : ''}</Badge>}
                    <Badge tone={TONS[d.statut]}>{d.statut}</Badge>
                  </span>
                </span>
                <span className="muted">{d.objectif}</span>
                <span className={`request__age${d.enRetard ? ' is-late' : ''}`}>{age(d)}</span>
              </button>
            ))}
          </section>

          <Card className="rise" style={{ flex: '2 1 420px', '--i': 2 }} aria-label={`Demande de ${sel.nom}`}>
            <div className="row" style={{ '--gap': '14px' }}>
              <Avatar initials={sel.initiales} size={52} />
              <div className="stack" style={{ '--gap': '2px', flex: '1 1 200px' }}>
                <h2 className="card__title" style={{ fontSize: 22 }}>{sel.nom}</h2>
                <span className="muted">Demande reçue le {dateCourte(sel.date)} · {sel.email}</span>
              </div>
              <Badge tone={TONS[sel.statut]}>{sel.statut}</Badge>
            </div>

            {sel.enRetard && <Notice tone="danger" icon="alert">Sans réponse depuis plus de 48 h. Répondez au candidat en priorité.</Notice>}

            <div className="grid-auto" style={{ '--min': '180px', '--gap': '12px' }}>
              <div className="info-tile"><span>Situation</span>{sel.situation || '—'}</div>
              <div className="info-tile"><span>Objectif</span>{sel.objectif}</div>
              <div className="info-tile"><span>Disponibilités</span>{sel.dispo || '—'}</div>
            </div>

            <div className="stack" style={{ '--gap': '10px' }}>
              <h3 className="card__label">Documents partagés par le candidat</h3>
              {sel.document ? (
                <div className="file-row">
                  <Icon name="doc" size={22} className="text-electric" />
                  <span style={{ flex: '1 1 160px' }}>{sel.document.nom}</span>
                  {sel.score !== null && <span className="muted">Dernier score : {sel.score} / 100</span>}
                  {sel.document.fichier ? (
                    <Button variant="secondary" icon="eye" href={api.lienDocument(sel.document.id)} target="_blank" rel="noreferrer">Consulter</Button>
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>Exemple sans fichier</span>
                  )}
                </div>
              ) : (
                <p className="muted">Aucun document partagé. Le candidat peut en partager depuis son espace.</p>
              )}
            </div>

            {sel.code !== 'cloturee' && (
              <>
                <Field as="textarea" rows={3} label="Répondre au candidat" placeholder="Votre message…" value={reponse} onChange={(e) => setReponse(e.target.value)} maxLength={2000} />
              </>
            )}
            {info && <Notice tone={info.tone} icon={info.tone === 'success' ? 'check' : 'alert'}>{info.texte}</Notice>}
            <div className="row">
              {sel.code !== 'cloturee' && <Button icon="send" onClick={repondre} disabled={!reponse.trim() || envoi}>Envoyer</Button>}
              <Button variant="secondary" disabled={envoi} onClick={() => agir(() => api.changerStatut(sel.id, SUIVANT[sel.code]), 'Statut mis à jour.')}>{ACTION[sel.code]}</Button>
              <Button variant="outline" to={`/conseiller/messages?demande=${sel.id}`} iconRight="chevRight">Conversation</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
