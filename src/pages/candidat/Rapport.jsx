import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { dateCourte, jourMois } from '../../format.js';
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
  const [params] = useSearchParams();
  const id = params.get('id') || 'derniere';
  const { data: r, loading, error, setData } = useAsync(() => api.rapport(id), [id]);
  const [filtre, setFiltre] = useState('Toutes');
  const [onglet, setOnglet] = useState('reco'); // utilisé sur mobile
  const [erreur, setErreur] = useState('');

  if (error && !r) return <Notice tone="danger" icon="alert">{error.message}</Notice>;
  if (loading || !r) return <PageSkeleton />;
  if (r.vide) {
    return (
      <>
        <PageHeader back={{ to: '/app', label: 'Tableau de bord' }} title="Rapport d’analyse" />
        <Card className="empty">
          <strong>Vous n’avez pas encore d’analyse.</strong>
          <span className="muted">Déposez votre CV : votre rapport s’affichera ici en moins d’une minute.</span>
          <Button to="/app/analyse/nouvelle" icon="upload">Analyser mon CV</Button>
        </Card>
      </>
    );
  }

  const maj = async (reco, champs) => {
    setErreur('');
    setData((d) => ({ ...d, recommandations: d.recommandations.map((x) => (x.id === reco.id ? { ...x, ...champs } : x)) }));
    try {
      await api.majRecommandation(reco.id, champs);
    } catch (e) {
      setErreur(e.message);
      setData((d) => ({ ...d, recommandations: d.recommandations.map((x) => (x.id === reco.id ? reco : x)) }));
    }
  };
  const noter = async (note) => {
    setData((d) => ({ ...d, note }));
    await api.noterAnalyse(r.id, note).catch((e) => setErreur(e.message));
  };

  const nbCorrige = r.recommandations.filter((x) => x.corrigee).length;
  const recos = r.recommandations.filter((x) => filtre === 'Toutes' || x.priorite === filtre);
  const ecart = r.scorePrecedent === null ? null : r.score - r.scorePrecedent;

  return (
    <>
      <PageHeader
        back={{ to: '/app', label: 'Tableau de bord' }}
        title="Rapport d’analyse"
        subtitle={`${r.documents} · ${r.poste} · ${dateCourte(r.date)}`}
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
                {ecart !== null && <Badge tone="glow">{ecart >= 0 ? '+' : ''}{ecart} depuis la v{r.version - 1}</Badge>}
              </div>
            </div>
            {r.versions.length > 1 && <VersionBars onDark items={r.versions.map((v) => ({ label: `${v.label} · ${jourMois(v.date)}`, value: v.score }))} />}
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
            {recos.length === 0 && <li className="muted">Aucune recommandation de cette priorité.</li>}
            {recos.map((x) => {
              const fait = x.corrigee;
              return (
                <li key={x.id} className={`reco${fait ? ' is-done' : ''}`}>
                  <div className="reco__body">
                    <div className="row" style={{ '--gap': '10px' }}>
                      <Badge tone={x.priorite}>Priorité {x.priorite}</Badge>
                      <span className="muted" style={{ fontSize: 13 }}>Section : {x.section}</span>
                    </div>
                    <strong className="reco__title">{x.titre}</strong>
                    <p className="muted">{x.detail}</p>
                    <button type="button" className="reco__report" onClick={() => maj(x, { signalee: !x.signalee })} aria-pressed={x.signalee}>
                      {x.signalee ? 'Signalée comme inadaptée · annuler' : 'Cette recommandation ne me correspond pas'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="reco__toggle"
                    aria-pressed={fait}
                    onClick={() => maj(x, { corrigee: !fait })}
                  >
                    {fait && <Icon name="check" size={16} stroke={3} />}
                    {fait ? 'Corrigé' : 'Marquer comme corrigé'}
                  </button>
                </li>
              );
            })}
          </ol>

          {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}

          <div className="rating">
            <span id="note-label">Ces recommandations vous ont-elles aidé ?</span>
            <div className="rating__stars" role="radiogroup" aria-labelledby="note-label">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={r.note === n} aria-label={`${n} sur 5`} className={`rating__star${r.note >= n ? ' is-on' : ''}`} onClick={() => noter(n)}>
                  ★
                </button>
              ))}
            </div>
            {r.note && <span className="muted">Merci pour votre avis.</span>}
          </div>

          <Notice tone="info" icon="info">
            Cette analyse est une aide pour améliorer votre candidature. Elle ne garantit ni un entretien ni un emploi.
          </Notice>
        </Card>
      </div>
    </>
  );
}
