// Dates venant du serveur (ISO, UTC) affichées à l'heure locale du navigateur.
const d = (iso) => (iso ? new Date(iso) : null);

export const dateCourte = (iso) => d(iso)?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';
export const jourMois = (iso) => d(iso)?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) ?? '';
export const heure = (iso) => d(iso)?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) ?? '';
export const jourLong = (iso) => {
  const s = d(iso)?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) ?? '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const dateHeure = (iso) => (iso ? `${jourMois(iso)} · ${heure(iso)}` : '');

// « il y a 3 jours », « hier », « aujourd'hui »
export function depuis(iso) {
  if (!iso) return '';
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    return h <= 0 ? 'à l’instant' : `il y a ${h} h`;
  }
  if (jours === 1) return 'hier';
  return `il y a ${jours} jours`;
}

export const taille = (o) => (o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`);
