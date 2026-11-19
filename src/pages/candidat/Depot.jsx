import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Checkbox, Field, Notice, PageHeader } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import { api, fichierEnBase64 } from '../../services/api.js';
import { useSession } from '../../session.jsx';

const MAX = 5 * 1024 * 1024;
const TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function verifier(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!TYPES.includes(file.type) && !['pdf', 'docx'].includes(ext)) return 'Format non accepté : déposez un PDF ou un DOCX.';
  if (file.size > MAX) return `« ${file.name} » fait ${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo. La taille maximale est de 5 Mo.`;
  return null;
}

const taille = (o) => (o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`);

function Depose({ label, optional, file, error, onFile }) {
  const input = useRef(null);
  const [survol, setSurvol] = useState(false);

  const prendre = (f) => onFile(f || null);

  if (file && !error) {
    return (
      <div className="file-ok">
        <span className="file-ok__icon"><Icon name="doc" size={22} /></span>
        <div className="file-ok__text">
          <strong>{file.name}</strong>
          <span>{taille(file.size)} · prêt</span>
        </div>
        <button type="button" className="icon-btn" aria-label={`Retirer ${file.name}`} onClick={() => prendre(null)}>
          <Icon name="trash" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <button
        type="button"
        className={`dropzone${survol ? ' is-over' : ''}${error ? ' has-error' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => { e.preventDefault(); setSurvol(false); prendre(e.dataTransfer.files[0]); }}
      >
        <Icon name="upload" size={28} />
        <strong>Ajouter {label.toLowerCase()}</strong>
        <span>Glissez le fichier ici ou parcourez · PDF ou DOCX, 5 Mo max.</span>
      </button>
      <input ref={input} type="file" accept=".pdf,.docx" hidden onChange={(e) => prendre(e.target.files[0])} aria-label={label} />
      {error && <Notice tone="danger" icon="alert" title="Fichier refusé">{error}</Notice>}
      {optional && !error && <span className="muted" style={{ fontSize: 13 }}>Facultatif</span>}
    </div>
  );
}

export default function Depot() {
  const navigate = useNavigate();
  const [cv, setCv] = useState(null);
  const [lettre, setLettre] = useState(null);
  const { utilisateur } = useSession();
  const [poste, setPoste] = useState(utilisateur?.posteVise || '');
  const [erreur, setErreur] = useState('');
  const [consent, setConsent] = useState(true);
  const [partage, setPartage] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const errCv = verifier(cv);
  const errLettre = verifier(lettre);
  const pret = cv && !errCv && !errLettre && consent && poste.trim();

  const lancer = async (e) => {
    e.preventDefault();
    if (!pret) return;
    setEnvoi(true);
    setErreur('');
    try {
      const [cvB64, lettreB64] = await Promise.all([fichierEnBase64(cv), lettre ? fichierEnBase64(lettre) : null]);
      const { id } = await api.lancerAnalyse({ poste: poste.trim(), consentement: consent, partage, cv: cvB64, lettre: lettreB64 });
      navigate(`/app/analyse/rapport?id=${id}`);
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Porte 3"
        title="Analyser ma candidature"
        subtitle="Déposez vos documents et indiquez le poste visé. Rapport en moins de 60 secondes."
      />

      <div className="split">
        <Card as="form" onSubmit={lancer} className="rise" style={{ flex: '2 1 440px', '--i': 1 }}>
          <div className="grid-auto" style={{ '--min': '240px' }}>
            <div className="stack" style={{ '--gap': '10px' }}>
              <h2 className="step-title"><span>1</span>Votre CV</h2>
              <Depose label="Votre CV" file={cv} error={errCv} onFile={setCv} />
            </div>
            <div className="stack" style={{ '--gap': '10px' }}>
              <h2 className="step-title"><span>2</span>Votre lettre</h2>
              <Depose label="Votre lettre" optional file={lettre} error={errLettre} onFile={setLettre} />
            </div>
          </div>

          <div className="stack" style={{ '--gap': '10px' }}>
            <h2 className="step-title"><span>3</span>Poste visé</h2>
            <Field label="Intitulé du poste" value={poste} placeholder="Ex. Assistante comptable" onChange={(e) => setPoste(e.target.value)} hint="Les recommandations seront adaptées à ce poste." />
          </div>

          <div className="consent">
            <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="J’accepte que mes documents soient analysés. Ils restent privés et ne servent jamais à entraîner une IA." />
            <Checkbox checked={partage} onChange={(e) => setPartage(e.target.checked)} label="Partager ces documents avec mon conseiller" />
          </div>

          {erreur && <Notice tone="danger" icon="alert" title="L’analyse n’a pas pu être lancée">{erreur}</Notice>}

          {envoi ? (
            <div className="analysing" role="status">
              <div className="analysing__bar"><span /></div>
              <strong>Analyse en cours…</strong>
              <span className="muted">Nous lisons votre CV et le comparons au poste visé.</span>
            </div>
          ) : (
            <div className="row">
              <Button type="submit" size="lg" disabled={!pret}>Lancer l’analyse</Button>
              <span className="muted">{pret ? 'Résultat en moins de 60 secondes.' : !cv ? 'Ajoutez au moins votre CV pour continuer.' : !poste.trim() ? 'Indiquez le poste visé.' : 'Cochez votre accord pour l’analyse.'}</span>
            </div>
          )}
        </Card>

        <aside className="stack" style={{ flex: '1 1 260px' }}>
          <Card className="rise" style={{ '--i': 2 }}>
            <h2 className="card__title">Ce que vous recevrez</h2>
            <ul className="checklist">
              {['Un score sur 100', 'Vos points forts', 'Les points à corriger', 'Des recommandations classées par priorité', 'Une comparaison avec vos versions précédentes'].map((t) => (
                <li key={t}><Icon name="check" size={18} stroke={2.5} />{t}</li>
              ))}
            </ul>
          </Card>
          <Card className="rise" style={{ '--i': 3 }}>
            <div className="row"><Icon name="lock" size={22} className="text-success" /><strong>Confidentialité</strong></div>
            <p className="muted">Vos documents sont conservés 12 mois au maximum. Vous pouvez les supprimer à tout moment depuis votre profil.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
