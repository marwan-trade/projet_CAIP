import { Doorway } from '../../components/Brand.jsx';
import { Button } from '../../components/ui.jsx';

export default function NotFound({ titre = 'Cette porte ne mène nulle part.', texte = 'La page demandée n’existe pas ou a été déplacée.', retour = '/' }) {
  return (
    <div className="not-found">
      <div style={{ width: 180 }}>
        <Doorway />
      </div>
      <h1>{titre}</h1>
      <p className="muted">{texte}</p>
      <Button to={retour}>Revenir à l’accueil</Button>
    </div>
  );
}
