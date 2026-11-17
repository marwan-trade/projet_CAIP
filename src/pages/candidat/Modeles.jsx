import { useMemo, useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button, Card, Chips, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import Vignette from '../../components/Vignette.jsx';

const ACCENTS = ['#1a4bff', '#071c7a', '#0e7a4f', '#b45309'];

export default function Modeles() {
  const { data, loading } = useAsync(api.modeles);
  const [type, setType] = useState('cv');
  const [secteur, setSecteur] = useState('Tous');
  const [recherche, setRecherche] = useState('');

  const liste = useMemo(() => {
    if (!data) return [];
    const q = recherche.trim().toLowerCase();
    return data.modeles.filter(
      (m) =>
        m.type === type &&
        (secteur === 'Tous' || m.secteur === secteur || m.secteur === 'Tous secteurs') &&
        (!q || `${m.nom} ${m.secteur}`.toLowerCase().includes(q)),
    );
  }, [data, type, secteur, recherche]);

  if (loading || !data) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Porte 1 et 2"
        title="Modèles et guides"
        subtitle="Choisissez un modèle, puis téléchargez-le ou remplissez-le en ligne."
        actions={
          <label className="search">
            <span className="sr-only">Rechercher un modèle</span>
            <Icon name="search" size={18} />
            <input type="search" placeholder="Comptable, stage, vente…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </label>
        }
      />

      <div className="row" style={{ '--gap': '12px' }}>
        <Segmented
          label="Type de document"
          value={type}
          onChange={setType}
          options={[
            { value: 'cv', label: 'CV' },
            { value: 'lettre', label: 'Lettres de motivation' },
          ]}
        />
        <Chips label="Secteur" options={data.secteurs} value={secteur} onChange={setSecteur} />
      </div>

      <Card as="a" href="#" interactive tone="tint" className="guide-banner">
        <Icon name="book" size={26} />
        <span><strong>Pas sûr de quoi écrire ?</strong> Le guide pas à pas vous indique quoi mettre, dans quel ordre, avec un exemple à chaque étape.</span>
        <Icon name="chevRight" size={20} />
      </Card>

      <p className="muted" aria-live="polite">{liste.length} {liste.length > 1 ? 'modèles' : 'modèle'}</p>

      {liste.length === 0 ? (
        <Card className="empty">
          <strong>Aucun modèle pour cette recherche.</strong>
          <Button variant="secondary" onClick={() => { setRecherche(''); setSecteur('Tous'); }}>Effacer les filtres</Button>
        </Card>
      ) : (
        <div className="grid-auto" style={{ '--min': '190px' }}>
          {liste.map((m, i) => (
            <Card key={m.id} interactive className="template-card rise" style={{ '--i': i }}>
              <Vignette style={m.style} accent={ACCENTS[i % ACCENTS.length]} />
              <div className="stack" style={{ '--gap': '2px' }}>
                <strong>{m.nom}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{m.secteur} · DOCX, PDF</span>
              </div>
              <div className="template-card__actions">
                <Button variant="secondary" aria-label={`Aperçu de ${m.nom}`}>Aperçu</Button>
                <Button aria-label={`Utiliser ${m.nom}`}>Utiliser</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
