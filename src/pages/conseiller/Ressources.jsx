import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button, Card, ErreurChargement, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

// Les contenus que voient les candidats, pour les citer pendant un échange.
export default function Ressources() {
  const modeles = useAsync(api.modeles);
  const themes = useAsync(api.entretiens);
  const [vue, setVue] = useState('entretiens');

  const erreur = modeles.error || themes.error;
  if (erreur && !(modeles.data && themes.data)) return <ErreurChargement error={erreur} onRetry={() => { modeles.recharger(); themes.recharger(); }} />;
  if (!modeles.data || !themes.data) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Espace conseiller"
        title="Ressources"
        subtitle="Les modèles et les questions d’entretien publiés pour les candidats."
        actions={<Segmented label="Type de ressource" value={vue} onChange={setVue} options={[{ value: 'entretiens', label: 'Entretiens' }, { value: 'modeles', label: 'Modèles' }]} />}
      />

      {vue === 'entretiens' ? (
        <div className="grid-auto" style={{ '--min': '300px' }}>
          {themes.data.map((t, i) => (
            <Card key={t.id} className="rise" style={{ '--i': i }}>
              <h2 className="card__title">{t.label}</h2>
              <p className="muted">{t.intro}</p>
              <ul className="bullet-list">
                {t.questions.map((q) => (
                  <li key={q.id}>
                    <Icon name="chat" size={18} className="text-electric" />
                    <span><strong>{q.q}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{q.conseil}</span></span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid-auto" style={{ '--min': '240px' }}>
          {modeles.data.modeles.map((m, i) => (
            <Card key={m.id} className="rise" style={{ '--i': i % 8 }}>
              <span className="eyebrow">{m.type === 'cv' ? 'CV' : 'Lettre'}</span>
              <strong>{m.nom}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{m.secteur}</span>
              <Button variant="secondary" icon="download" href={api.lienModele(m.id)} download>Télécharger</Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
