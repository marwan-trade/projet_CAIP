// Aperçu miniature d'un modèle (CV classique, CV en colonne, lettre).
export default function Vignette({ style = 'classique', accent = '#1a4bff' }) {
  if (style === 'colonne') {
    return (
      <div className="vignette vignette--colonne" aria-hidden="true">
        <div className="vignette__side">
          <span className="vignette__photo" />
          <span className="vignette__line vignette__line--dark" style={{ width: '62%' }} />
          <span className="vignette__line vignette__line--dark" style={{ width: '48%' }} />
        </div>
        <div className="vignette__main">
          <span className="vignette__title" style={{ width: '80%', background: '#0a1550' }} />
          {[90, 74, 86, 60].map((w, i) => <span key={i} className="vignette__line" style={{ width: `${w}%` }} />)}
          <span className="vignette__title vignette__title--small" style={{ width: '42%', background: accent }} />
          {[88, 70].map((w, i) => <span key={i} className="vignette__line" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    );
  }
  if (style === 'lettre') {
    return (
      <div className="vignette" aria-hidden="true">
        <span className="vignette__line" style={{ width: '38%', alignSelf: 'flex-end' }} />
        <span className="vignette__line" style={{ width: '46%' }} />
        <span className="vignette__title vignette__title--small" style={{ width: '58%', background: accent, marginTop: 10 }} />
        {[95, 90, 93, 88, 60].map((w, i) => <span key={i} className="vignette__line" style={{ width: `${w}%` }} />)}
      </div>
    );
  }
  return (
    <div className="vignette" aria-hidden="true">
      <span className="vignette__title" style={{ width: '66%', background: accent }} />
      <span className="vignette__line vignette__line--soft" style={{ width: '42%' }} />
      <span className="vignette__rule" />
      {[90, 80, 86].map((w, i) => <span key={i} className="vignette__line" style={{ width: `${w}%` }} />)}
      <span className="vignette__title vignette__title--small" style={{ width: '38%', background: '#38c6ff' }} />
      {[90, 70].map((w, i) => <span key={i} className="vignette__line" style={{ width: `${w}%` }} />)}
    </div>
  );
}
