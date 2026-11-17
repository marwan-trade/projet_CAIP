import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Badge, Button, Card, Chips, Notice, PageHeader, PageSkeleton, Segmented } from '../../components/ui.jsx';
import { ScoreGauge, VersionBars } from '../../components/Progressions.jsx';
import { Swoosh } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';

function Liste({ items, icon, tone }) {
  return (
    <ul className="bullet-list">
      {items.map((t) => (
        <li key={t}><Icon name={icon} size={18} stroke={2.5} className={`text-${tone}`} />{t}</li>
      ))}
    </ul>
  );
}

export default function Rapport() {
  const { data: r, loading } = useAsync(api.rapport);
  const [filtre, setFiltre] = useState('Toutes');
  const [corrige, setCorrige] = useState({});
  const [onglet, setOnglet] = useState('reco'); // utilisé sur mobile

  if (loading || !r) return <PageSkeleton />;

  const nbCorrige = Object.values(corrige).filter(Boolean).length;
  const recos = r.recommandations.filter((x) => filtre === 'Toutes' || x.priorite === filtre);

  return (
    <>
      <PageHeader
        back={{ to: '/app', label: 'Tableau de bord' }}
        title="Rapport d’analyse"
        subtitle={`${r.documents} · ${r.poste} · ${r.date}`}
        actions={
          <>
            <Button to="/app/accompagnement" variant="secondary">Demander l’avis d’un conseiller</Button>
            <Button to="/app/analyse/nouvelle" icon="upload">Nouvelle version</Button>
          </>
        }
      />

      <div className="split report">
        <div className="stack report__side" style={{ flex: '1 1 300px' }}>
          <Card tone="night" className="score-card rise" style={{ '--i': 1 }}>
            <Swoosh />
            <div className="row" style={{ '--gap': '18px' }}>
              <ScoreGauge score={r.score} />
              <div className="stack" style={{ '--gap': '8px' }}>
                <strong className="score-card__verdict">{r.verdict}</strong>
                <Badge tone="glow">+{r.score - r.scorePrecedent} depuis la v1</Badge>
              </div>
            </div>
            <VersionBars onDark items={[{ label: 'v1 · 8 nov.', value: r.scorePrecedent }, { label: 'v2 · 12 nov.', value: r.score }]} />
          </Card>

          <div className="report__mobile-tabs">
            <Segmented
              stretch
              size="sm"
              label="Sections du rapport"
              value={onglet}
              onChange={setOnglet}
              options={[
                { value: 'reco', label: 'Recommandations' },
                { value: 'forts', label: 'Points forts' },
                { value: 'faibles', label: 'À corriger' },
              ]}
            />
          </div>

          <Card className={`rise report__panel${onglet === 'forts' ? ' is-shown' : ''}`} style={{ '--i': 2 }}>
            <h2 className="card__title">Points forts</h2>
            <Liste items={r.pointsForts} icon="check" tone="success" />
          </Card>
          <Card className={`rise report__panel${onglet === 'faibles' ? ' is-shown' : ''}`} style={{ '--i': 3 }}>
            <h2 className="card__title">Points à corriger</h2>
            <Liste items={r.aCorriger} icon="alert" tone="warn" />
          </Card>
        </div>

        <Card className={`rise report__panel report__main${onglet === 'reco' ? ' is-shown' : ''}`} style={{ flex: '2 1 440px', '--i': 2 }}>
          <div className="card__head">
            <h2 className="card__title">
              Recommandations <span className="muted">({nbCorrige} / {r.recommandations.length} corrigées)</span>
            </h2>
            <Chips label="Filtrer par priorité" options={['Toutes', 'Haute', 'Moyenne', 'Basse']} value={filtre} onChange={setFiltre} />
          </div>

          <ol className="recos">
            {recos.map((x) => {
              const fait = !!corrige[x.id];
              return (
                <li key={x.id} className={`reco${fait ? ' is-done' : ''}`}>
                  <div className="reco__body">
                    <div className="row" style={{ '--gap': '10px' }}>
                      <Badge tone={x.priorite}>Priorité {x.priorite}</Badge>
                      <span className="muted" style={{ fontSize: 13 }}>Section : {x.section}</span>
                    </div>
                    <strong className="reco__title">{x.titre}</strong>
                    <p className="muted">{x.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="reco__toggle"
                    aria-pressed={fait}
                    onClick={() => setCorrige((c) => ({ ...c, [x.id]: !fait }))}
                  >
                    {fait && <Icon name="check" size={16} stroke={3} />}
                    {fait ? 'Corrigé' : 'Marquer comme corrigé'}
                  </button>
                </li>
              );
            })}
          </ol>

          <Notice tone="info" icon="info" action={<a href="#" className="link-arrow">Signaler une recommandation</a>}>
            Cette analyse est une aide pour améliorer votre candidature. Elle ne garantit ni un entretien ni un emploi.
          </Notice>
        </Card>
      </div>
    </>
  );
}
