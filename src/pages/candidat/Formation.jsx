import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button, Card, Notice, PageHeader, PageSkeleton, Progress } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

export default function Formation() {
  const { data, loading } = useAsync(api.formation);
  const [choix, setChoix] = useState(null);
  const [valide, setValide] = useState(false);

  if (loading || !data) return <PageSkeleton />;
  const { modules, quiz } = data;
  const nbValides = modules.filter((m) => m.etat === 'valide').length;
  const courant = modules.find((m) => m.etat === 'en-cours');
  const juste = choix === quiz.bonne;

  const etatOption = (i) => {
    if (valide && i === quiz.bonne) return 'is-right';
    if (valide && i === choix) return 'is-wrong';
    if (i === choix) return 'is-selected';
    return '';
  };

  const suivant = () => {
    if (valide) {
      setChoix(null);
      setValide(false);
    } else if (choix !== null) {
      setValide(true);
    }
  };

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
                    {m.etat === 'valide' ? 'Validé' : m.etat === 'en-cours' ? `En cours · question ${m.question} / ${m.total}` : 'À venir'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Notice tone="warn" icon="award">Votre attestation de suivi sera disponible après le module 6.</Notice>
        </Card>

        <Card className="quiz rise" style={{ flex: '2 1 440px', '--i': 2 }}>
          <div className="card__head">
            <span className="eyebrow">Module {courant.n} · Quiz</span>
            <span className="muted">Question {courant.question} / {courant.total}</span>
          </div>
          <Progress value={(courant.question / courant.total) * 100} label="Avancement du quiz" />
          <h2 id="question" className="quiz__question">{quiz.question}</h2>

          <div className="quiz__options" role="radiogroup" aria-labelledby="question">
            {quiz.options.map((o, i) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={choix === i}
                disabled={valide}
                className={`quiz__option ${etatOption(i)}`}
                onClick={() => setChoix(i)}
              >
                <span className="quiz__radio" />
                {o}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {valide && (
              <Notice tone={juste ? 'success' : 'warn'} icon={juste ? 'check' : 'info'} title={juste ? 'Bonne réponse' : 'Pas tout à fait'}>
                {juste ? quiz.explicationBonne : quiz.explicationFausse}
              </Notice>
            )}
          </div>

          <div>
            <Button size="lg" disabled={choix === null} onClick={suivant}>{valide ? 'Question suivante' : 'Valider'}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
