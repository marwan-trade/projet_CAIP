import { partenaires } from '../data/mock.js';
import { asset } from '../config.js';
import Icon from './Icon.jsx';

// Logos des centres de formation partenaires.
// `compact` : bande discrète (page de connexion) ; sinon grands emplacements (accueil).
export default function PartnerLogos({ compact = false, label = 'Centres de formation partenaires' }) {
  return (
    <ul className={`partner-logos${compact ? ' partner-logos--compact' : ''}`} aria-label={label}>
      {partenaires.map((p) => {
        const contenu = p.logo ? (
          <img src={asset(p.logo)} alt={p.nom} loading="lazy" />
        ) : (
          <>
            <Icon name="cap" size={compact ? 18 : 22} />
            <span>{p.nom}</span>
          </>
        );
        return (
          <li key={p.nom} className={`partner-slot${p.logo ? ' partner-slot--logo' : ''}`}>
            {p.site ? <a href={p.site} target="_blank" rel="noreferrer">{contenu}</a> : contenu}
          </li>
        );
      })}
    </ul>
  );
}
