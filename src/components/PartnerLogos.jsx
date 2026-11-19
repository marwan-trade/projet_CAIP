import { partenaires as exemples } from '../data/mock.js';
import { asset } from '../config.js';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import Icon from './Icon.jsx';

// Logos des centres de formation partenaires.
// `compact` : petites pastilles rondes et discrètes (page de connexion) ;
//             le nom n'apparaît qu'au survol et pour les lecteurs d'écran.
// sinon     : grands emplacements avec le nom (section Partenariats de l'accueil).
// `onDark`  : sur fond bleu nuit, logos passés en blanc.
export default function PartnerLogos({ compact = false, onDark = false, label = 'Centres de formation partenaires' }) {
  // Liste gérée par l'administrateur (Contenus › Partenaires) ; exemples tant qu'elle charge.
  const { data } = useAsync(api.partenaires);
  const partenaires = data || exemples;
  const cls = ['partner-logos', compact && 'partner-logos--compact', onDark && 'partner-logos--on-dark'].filter(Boolean).join(' ');
  return (
    <ul className={cls} aria-label={label}>
      {partenaires.map((p) => {
        const visuel = p.logo ? (
          <img src={asset(p.logo)} alt={compact ? '' : p.nom} loading="lazy" />
        ) : (
          <Icon name="cap" size={compact ? 16 : 22} />
        );
        const contenu = compact ? (
          <>
            {visuel}
            <span className="sr-only">{p.nom}</span>
          </>
        ) : (
          <>
            {visuel}
            {!p.logo && <span>{p.nom}</span>}
          </>
        );
        return (
          <li key={p.nom} className={`partner-slot${p.logo ? ' partner-slot--logo' : ''}`} title={compact ? p.nom : undefined}>
            {p.site ? <a href={p.site} target="_blank" rel="noreferrer">{contenu}</a> : contenu}
          </li>
        );
      })}
    </ul>
  );
}
