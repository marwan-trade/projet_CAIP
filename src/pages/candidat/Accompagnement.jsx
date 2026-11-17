import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Avatar, Badge, Button, Card, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import { Timeline } from '../../components/Progressions.jsx';
import Icon from '../../components/Icon.jsx';

export default function Accompagnement() {
  const { data, loading } = useAsync(api.accompagnement);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const fin = useRef(null);

  useEffect(() => {
    if (data) setMessages(data.messages);
  }, [data]);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  if (loading || !data) return <PageSkeleton />;
  const { conseiller } = data;

  const envoyer = (e) => {
    e.preventDefault();
    const t = texte.trim();
    if (!t) return;
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { de: 'moi', texte: t, heure }]);
    setTexte('');
  };

  return (
    <>
      <PageHeader
        eyebrow="Accompagnement"
        title="Mon accompagnement"
        subtitle={`Demande envoyée le ${data.envoyee}`}
        actions={<Button variant="secondary" icon="plus">Nouvelle demande</Button>}
      />

      <div className="split">
        <div className="stack" style={{ flex: '1 1 300px' }}>
          <Card className="rise" style={{ '--i': 1 }}>
            <h2 className="card__title">Suivi de la demande</h2>
            <Timeline steps={data.etapes} />
            <p className="row muted" style={{ fontSize: 13, '--gap': '8px' }}><Icon name="mail" size={16} />Un e-mail à chaque changement de statut.</p>
          </Card>
          <Card className="rise" style={{ '--i': 2 }}>
            <h2 className="card__title">Ma demande</h2>
            <dl className="details">
              <div><dt>Objectif</dt><dd>{data.objectif}</dd></div>
              <div><dt>Disponibilités</dt><dd>{data.disponibilites}</dd></div>
            </dl>
            <hr className="sep" />
            {data.documents.map((d) => (
              <div key={d.nom} className="card__head">
                <span>{d.nom}</span>
                <Badge tone={d.partage ? 'success' : 'neutral'}>{d.partage ? 'Partagé' : 'Privé'}</Badge>
              </div>
            ))}
            <p className="muted" style={{ fontSize: 13 }}>Votre conseiller ne voit que les documents que vous partagez.</p>
          </Card>
        </div>

        <Card className="chat rise" style={{ flex: '2 1 440px', '--i': 2 }}>
          <div className="chat__head">
            <Avatar initials={conseiller.initiales} tone="navy" size={46} />
            <div className="stack" style={{ '--gap': '0px', flex: 1 }}>
              <strong>{conseiller.nom}</strong>
              <span className="muted" style={{ fontSize: 13 }}>Conseiller · {conseiller.specialite}</span>
            </div>
            <Badge tone="success">En cours</Badge>
          </div>

          <div className="chat__body" aria-live="polite">
            <span className="chat__day">Mardi 11 novembre</span>
            {messages.map((m, i) => (
              <div key={i} className={`bubble bubble--${m.de === 'moi' ? 'me' : 'them'}`}>
                {m.texte}
                <span className="bubble__meta">{m.de === 'moi' ? 'Vous' : conseiller.nom} · {m.heure}</span>
              </div>
            ))}
            <div ref={fin} />
          </div>

          <form className="chat__form" onSubmit={envoyer}>
            <button type="button" className="icon-btn" aria-label="Joindre un fichier (5 Mo max.)"><Icon name="upload" size={18} /></button>
            <label className="sr-only" htmlFor="message">Votre message</label>
            <input id="message" className="field__control" placeholder="Écrire un message…" value={texte} onChange={(e) => setTexte(e.target.value)} />
            <button type="submit" className="send-btn" aria-label="Envoyer" disabled={!texte.trim()}><Icon name="send" size={20} /></button>
          </form>
        </Card>
      </div>
    </>
  );
}
