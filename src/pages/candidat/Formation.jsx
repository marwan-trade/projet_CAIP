import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button, Card, ErreurChargement, Notice, PageHeader, PageSkeleton, Progress } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

export default function Formation() {
  const { data, loading, error, recharger } = useAsync(api.formation);
  const [choix, setChoix] = useState(null);
  const [resultat, setResultat] = useState(null); // réponse du serveur à la question en cours
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  if (error && !data) return <ErreurChargement error={error} onRetry={recharger} />;
  if (loading || !data) return <PageSkeleton />;
  const { modules, quiz, termine } = data;
  const nbValides = modules.filter((m) => m.etat === 'valide').length;

  const etatOption = (i) => {
    if (resultat && i === resultat.bonne) return 'is-right';
    if (resultat && i === choix) return 'is-wrong';
    if (i === choix) return 'is-selected';
    return '';
  };

  const valider = async () => {
    if (choix === null) return;
    setEnvoi(true);
    setErreur('');
    try {
      setResultat(await api.repondreQuiz(quiz.moduleId, choix));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  const suivant = async () => {
    setEnvoi(true);
    await recharger();
    setChoix(null);
    setResultat(null);
    setEnvoi(false);
  };

  const fin = resultat?.fin;

  return (
    <>
      <PageHeader eyebrow="Porte 5" title="Formation" subtitle="Six modules courts, chacun validé par un quiz. Attestation de suivi à la fin." />

      <div className="split">
        <Card className="modules rise" style={{ flex: '1 1 280px', '--i': 1 }}>
          <div className="stack" style={{ '--gap': '10px' }}>
            <div className="card__head"><strong>Ma progression</strong><span className="muted">{nbValides} / {modules.length}</span></div>
            <Progress value={Math.round((nbValides / modules.length) * 100)} tone="success" label="Modules validés" />
          </div>
          <ol className="modules__list">
            {modules.map((m) => (
              <li key={m.n} className={`module module--${m.etat}`} aria-current={m.etat === 'en-cours' ? 'step' : undefined}>
                <span className="module__num">{m.etat === 'valide' ? <Icon name="check" size={16} stroke={3} /> : m.n}</span>
                <span className="stack" style={{ '--gap': '2px' }}>
                  <strong>{m.titre}</strong>
                  <span className="module__state">
                    {m.etat === 'valide' ? 'Validé' : m.etat === 'en-cours' ? `En cours · question ${Math.min(m.question, m.total)} / ${m.total}` : 'À venir'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          {termine ? (
            <Notice tone="success" icon="award" title="Formation terminée">Bravo, vous avez validé les six modules. Votre attestation de suivi est disponible auprès de votre conseiller.</Notice>
          ) : (
            <Notice tone="warn" icon="award">Votre attestation de suivi sera disponible après le module {modules.length}.</Notice>
          )}
        </Card>

        <Card className="quiz rise" style={{ flex: '2 1 440px', '--i': 2 }}>
          {termine || !quiz ? (
            <div className="empty">
              <Icon name="award" size={40} className="text-success" />
              <strong>Tous les modules sont validés.</strong>
              <span className="muted">Révisez les questions d’entretien pour garder le rythme.</span>
              <Button to="/app/entretiens" variant="secondary">Préparer l’entretien</Button>
            </div>
          ) : (
            <>
              <div className="card__head">
                <span className="eyebrow">Module {quiz.n} · {quiz.titre}</span>
                <span className="muted">Question {quiz.question} / {quiz.total}</span>
              </div>
              <Progress value={((quiz.question - (resultat ? 0 : 1)) / quiz.total) * 100} label="Avancement du quiz" />
              <h2 id="question" className="quiz__question">{quiz.intitule}</h2>

              <div className="quiz__options" role="radiogroup" aria-labelledby="question">
                {quiz.options.map((o, i) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={choix === i}
                    disabled={!!resultat || envoi}
                    className={`quiz__option ${etatOption(i)}`}
                    onClick={() => setChoix(i)}
                  >
                    <span className="quiz__radio" />
                    {o}
                  </button>
                ))}
              </div>

              <div aria-live="polite" className="stack" style={{ '--gap': '10px' }}>
                {resultat && (
                  <Notice tone={resultat.juste ? 'success' : 'warn'} icon={resultat.juste ? 'check' : 'info'} title={resultat.juste ? 'Bonne réponse' : 'Pas tout à fait'}>
                    {resultat.explication}
                  </Notice>
                )}
                {fin?.valide && (
                  <Notice tone="success" icon="award" title={`Module ${quiz.n} validé`}>
                    {fin.bonnes} bonnes réponses sur {fin.total}. Le module suivant est débloqué.
                  </Notice>
                )}
                {fin && !fin.valide && (
                  <Notice tone="warn" icon="info" title="Module à reprendre">
                    {fin.bonnes} bonne{fin.bonnes > 1 ? 's' : ''} réponse{fin.bonnes > 1 ? 's' : ''} sur {fin.total} : il en faut {fin.seuil} pour valider. Le quiz recommence à la première question.
                  </Notice>
                )}
                {erreur && <Notice tone="danger" icon="alert">{erreur}</Notice>}
              </div>

              <div>
                {resultat ? (
                  <Button size="lg" onClick={suivant} disabled={envoi}>
                    {fin ? (fin.valide ? 'Module suivant' : 'Recommencer le module') : 'Question suivante'}
                  </Button>
                ) : (
                  <Button size="lg" disabled={choix === null || envoi} onClick={valider}>Valider</Button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
