import { Link } from 'react-router-dom';

// Logo + mot-symbole. `onDark` pour les fonds nuit.
export function Logo({ to = '/', size = 36, onDark = false, label = true }) {
  return (
    <Link to={to} className={`logo${onDark ? ' logo--on-dark' : ''}`} aria-label="CAIP, accueil">
      <img src="/logo.png" alt="" width={size} height={size} style={{ borderRadius: size * 0.28 }} />
      {label && <span className="logo__word">CAIP</span>}
    </Link>
  );
}

// L'arc lumineux du logo, qui se dessine puis flotte.
// Purement décoratif : à placer dans un conteneur `position: relative`.
export function Swoosh({ className = '' }) {
  return (
    <svg className={`swoosh ${className}`} viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="caip-swoosh" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8adcff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d="M30 370 C 170 260, 360 120, 585 55" stroke="url(#caip-swoosh)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M130 395 C 270 305, 430 225, 595 195" stroke="url(#caip-swoosh)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// La porte entrouverte : illustration signature du hero.
// La porte pivote légèrement et laisse passer un faisceau de lumière.
export function Doorway({ children }) {
  return (
    <div className="doorway" aria-hidden={children ? undefined : true}>
      <div className="doorway__frame">
        <div className="doorway__light" />
        <div className="doorway__leaf">
          <span className="doorway__knob" />
        </div>
      </div>
      <div className="doorway__beam" />
      {children && <div className="doorway__content">{children}</div>}
    </div>
  );
}
