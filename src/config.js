// Chemin de base du site (« / » en local, « /projet_CAIP/ » sur GitHub Pages).
// Vite le remplit à partir de l'option `base` de vite.config.js.
export const BASE = import.meta.env?.BASE_URL ?? '/';
export const asset = (path) => `${BASE}${path.replace(/^\//, '')}`;
