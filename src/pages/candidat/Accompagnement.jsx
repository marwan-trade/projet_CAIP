import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, ErreurChargement, Field, Notice, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import { Timeline } from '../../components/Progressions.jsx';
import Icon from '../../components/Icon.jsx';
import { dateCourte, dateHeure, heure, jourLong } from '../../format.js';

// Messages regroupés par jour, comme dans une messagerie.
export function FilMessages({ messages, nomAutre }) {
  const fin = useRef(null);
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);
  let jour = '';
  return (
    <div className="chat__body" aria-live="polite">
      {messages.length === 0 && <p className="muted chat__empty">Aucun message pour l’instant.</p>}
      {messages.map((m) => {
        const j = jourLong(m.date);
        const separateur = j !== jour;
        jour = j;
        return (
          <div key={m.id} className="chat__group">
            {separateur && <span className="chat__day">{j}</span>}
            <div className={`bubble bubble--${m.de === 'moi' ? 'me' : 'them'}`}>
              {m.texte}
              <span className="bubble__meta">{m.de === 'moi' ? 'Vous' : nomAutre || m.auteur} · {heure(m.date)}</span>
            </div>
          </div>
        );
      })}
      <div ref={fin} />
    </div>
  );
}

export function FormMessage({ onEnvoyer, disabled, raison }) {
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const envoyer = async (e) => {
    e.preventDefault();
    const t = texte.trim();
    if (!t) return;
    setEnvoi(true);
    setErreur('');
    try {
      await onEnvoyer(t);
      setTexte('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <>
      {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}
      {disabled ? (
        <p className="muted chat__disabled">{raison}</p>
      ) : (
        <form className="chat__form" onSubmit={envoyer}>
          <label className="sr-only" htmlFor="message">Votre message</label>
          <input id="message" className="field__control" placeholder="Écrire un message…" value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={2000} />
          <button type="submit" className="send-btn" aria-label="Envoyer" disabled={!texte.trim() || envoi}><Icon name="send" size={20} /></button>
        </form>
      )}
    </>
  );
}

function NouvelleDemande({ onCree, onAnnuler }) {
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if (!String(d.objectif || '').trim()) return setErreurs({ objectif: 'Décrivez votre objectif.' });
    setEnvoi(true);
    try {
      await api.nouvelleDemande(d);
      onCree();
    } catch (err) {
      setErreurs({ ...err.champs, global: err.message });
      setEnvoi(false);
    }
  };
  return (
    <Card as="form" className="rise" onSubmit={onSubmit} noValidate style={{ maxWidth: 640 }}>
      <h2 className="card__title">Demander un accompagnement</h2>
      <p className="muted">Un conseiller vous est assigné sous 48 h ouvrées. Il ne voit que les documents que vous choisissez de partager.</p>
      <Field label="Votre objectif" name="objectif" placeholder="Ex. Obtenir un premier poste en comptabilité" error={erreurs.objectif} maxLength={300} />
      <Field label="Votre situation" name="situation" placeholder="Ex. Jeune diplômée, en recherche depuis 3 mois" maxLength={300} />
      <Field label="Vos disponibilités" name="disponibilites" placeholder="Ex. Matinées en semaine" maxLength={150} />
      {erreurs.global && <Notice tone="danger" icon="alert">{erreurs.global}</Notice>}
      <div className="row">
        <Button type="submit" disabled={envoi}>{envoi ? 'Envoi…' : 'Envoyer ma demande'}</Button>
        {onAnnuler && <Button variant="secondary" onClick={onAnnuler}>Annuler</Button>}
      </div>
    </Card>
  );
}

export default function Accompagnement() {
  const { data, loading, error, recharger, setData } = useAsync(api.accompagnement);
  const [nouvelle, setNouvelle] = useState(false);

  // Nouveaux messages du conseiller : vérification toutes les 20 secondes.
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === 'visible' && recharger(), 20000);
    return () => clearInterval(id);
  }, [recharger]);

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;
  const { demande, documents } = data;

  if (!demande || nouvelle) {
    return (
      <>
        <PageHeader eyebrow="Accompagnement" title="Mon accompagnement" subtitle="Un conseiller relit vos documents et vous prépare à l’entretien." />
        <NouvelleDemande
          onCree={() => { setNouvelle(false); recharger(); }}
          onAnnuler={demande ? () => setNouvelle(false) : null}
        />
      </>
    );
  }

  const { conseiller } = demande;
  const partager = async (doc) => {
    setData((d) => ({ ...d, documents: d.documents.map((x) => (x.id === doc.id ? { ...x, partage: !x.partage } : x)) }));
    await api.partagerDocument(doc.id, !doc.partage).catch(recharger);
  };
  const envoyer = async (t) => {
    const messages = await api.envoyerMessage(demande.id, t);
    setData((d) => ({ ...d, messages }));
  };
  const tons = { 'En cours': 'success', Clôturée: 'neutral', Reçue: 'info', Assignée: 'info' };

  return (
    <>
      <PageHeader
        eyebrow="Accompagnement"
        title="Mon accompagnement"
        subtitle={`Demande envoyée le ${dateCourte(demande.envoyee)}`}
        actions={demande.statut === 'Clôturée' && <Button variant="secondary" icon="plus" onClick={() => setNouvelle(true)}>Nouvelle demande</Button>}
      />

      <div className="split">
        <div className="stack" style={{ flex: '1 1 300px' }}>
          <Card className="rise" style={{ '--i': 1 }}>
            <h2 className="card__title">Suivi de la demande</h2>
            <Timeline steps={demande.etapes.map((e) => ({ ...e, quand: e.quand ? dateHeure(e.quand) : '' }))} />
          </Card>
          <Card className="rise" style={{ '--i': 2 }}>
            <h2 className="card__title">Ma demande</h2>
            <dl className="details">
              <div><dt>Objectif</dt><dd>{demande.objectif}</dd></div>
              {demande.situation && <div><dt>Situation</dt><dd>{demande.situation}</dd></div>}
              {demande.disponibilites && <div><dt>Disponibilités</dt><dd>{demande.disponibilites}</dd></div>}
            </dl>
            <hr className="sep" />
            {documents.length === 0 && <p className="muted">Aucun document déposé.</p>}
            {documents.map((d) => (
              <div key={d.id} className="card__head">
                <span className="doc-name">{d.nom}</span>
                <button type="button" className="badge-toggle" aria-pressed={d.partage} onClick={() => partager(d)} title={d.partage ? 'Cliquer pour rendre privé' : 'Cliquer pour partager'}>
                  <Badge tone={d.partage ? 'success' : 'neutral'}>{d.partage ? 'Partagé' : 'Privé'}</Badge>
                </button>
              </div>
            ))}
            <p className="muted" style={{ fontSize: 13 }}>Votre conseiller ne voit que les documents partagés. Touchez l’étiquette pour changer.</p>
          </Card>
        </div>

        <Card className="chat rise" style={{ flex: '2 1 440px', '--i': 2 }}>
          <div className="chat__head">
            {conseiller ? <Avatar initials={conseiller.initiales} tone="navy" size={46} /> : <Avatar initials="?" tone="ink" size={46} />}
            <div className="stack" style={{ '--gap': '0px', flex: 1 }}>
              <strong>{conseiller ? conseiller.nom : 'Conseiller à venir'}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{conseiller ? `Conseiller · ${conseiller.specialite}` : 'Assignation sous 48 h ouvrées'}</span>
            </div>
            <Badge tone={tons[demande.statut] || 'info'}>{demande.statut}</Badge>
          </div>

          <FilMessages messages={data.messages} nomAutre={conseiller?.nom} />
          <FormMessage
            onEnvoyer={envoyer}
            disabled={!conseiller || demande.statut === 'Clôturée'}
            raison={!conseiller ? 'La messagerie s’ouvrira dès qu’un conseiller sera assigné à votre demande.' : 'Cette demande est clôturée. Vous pouvez en ouvrir une nouvelle.'}
          />
        </Card>
      </div>
    </>
  );
}
