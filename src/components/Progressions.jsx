import Icon from './Icon.jsx';

// Jauge circulaire du score (0–100) qui se remplit à l'affichage.
export function ScoreGauge({ score, size = 120, onDark = true, caption = 'sur 100' }) {
  const circ = 2 * Math.PI * 52; // ≈ 327
  const filled = (score / 100) * circ;
  return (
    <svg className={`gauge${onDark ? ' gauge--on-dark' : ''}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Score : ${score} sur 100`}>
      <defs>
        <linearGradient id="caip-gauge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={onDark ? '#8adcff' : '#2d5bff'} />
          <stop offset="1" stopColor={onDark ? '#38c6ff' : '#0a2fb8'} />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" className="gauge__track" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke="url(#caip-gauge)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 60 60)"
        className="gauge__value"
      />
      <text x="60" y="64" textAnchor="middle" className="gauge__score">{score}</text>
      <text x="60" y="84" textAnchor="middle" className="gauge__caption">{caption}</text>
    </svg>
  );
}

// Le parcours en « portes » : chaque étape franchie s'illumine.
export function DoorSteps({ steps }) {
  const done = steps.filter((s) => s.etat === 'fait').length;
  return (
    <ol className="doorsteps" aria-label={`Parcours : ${done} étapes franchies sur ${steps.length}`}>
      {steps.map((s, i) => (
        <li key={s.id} className={`doorsteps__item doorsteps__item--${s.etat}`} aria-current={s.etat === 'en-cours' ? 'step' : undefined}>
          <span className="doorsteps__door">
            {s.etat === 'fait' ? <Icon name="check" size={16} stroke={3} /> : <span>{i + 1}</span>}
          </span>
          <span className="doorsteps__label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

// Suivi vertical d'une demande (Reçue → Assignée → En cours → Clôturée).
export function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((s) => (
        <li key={s.label} className={`timeline__item timeline__item--${s.etat}`} aria-current={s.etat === 'en-cours' ? 'step' : undefined}>
          <span className="timeline__dot">{s.etat === 'fait' && <Icon name="check" size={13} stroke={3.5} />}</span>
          <span className="timeline__text">
            <strong>{s.label}</strong>
            {s.quand && <span className="muted">{s.quand}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

// Comparaison simple de deux versions (barres horizontales).
export function VersionBars({ items, onDark }) {
  return (
    <div className={`vbars${onDark ? ' vbars--on-dark' : ''}`} role="img" aria-label={items.map((i) => `${i.label} : ${i.value}`).join(', ')}>
      {items.map((i, idx) => (
        <div key={i.label} className="vbars__row">
          <span className="vbars__label">{i.label}</span>
          <span className="vbars__track">
            <span className={`vbars__fill${idx === items.length - 1 ? ' vbars__fill--current' : ''}`} style={{ width: `${i.value}%` }} />
          </span>
          <span className="vbars__value">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
