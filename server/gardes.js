import { echec } from './http.js';

// Accès réservé aux personnes connectées, éventuellement à certains rôles.
export const connecte = (r) => {
  if (!r.utilisateur) echec(401, 'Connectez-vous pour continuer.');
};

export const role = (...roles) => (r) => {
  connecte(r);
  if (!roles.includes(r.utilisateur.role)) echec(403, 'Cette page n’est pas accessible avec votre compte.');
};

const TITRE = /^(M\.|Mme|Mlle|Dr)\s+/;
const mots = (nom) => String(nom || '').trim().split(/\s+/).filter(Boolean);

// « Amina Hassan » → « AH » ; « M. Ali » → « MA ».
export function initiales(nom) {
  const m = mots(nom);
  if (TITRE.test(nom)) return `M${(m[1]?.[0] || '').toUpperCase()}`;
  return ((m[0]?.[0] || '') + (m.length > 1 ? m[m.length - 1][0] : '')).toUpperCase() || '?';
}

// « Amina Hassan » → « Amina » ; « M. Ali » reste « M. Ali ».
export const prenom = (nom) => (TITRE.test(nom) ? nom : mots(nom)[0] || nom);

// Forme publique d'un utilisateur (jamais le mot de passe).
export function publicUtilisateur(u) {
  return {
    id: u.id,
    nom: u.nom_complet,
    prenom: prenom(u.nom_complet),
    initiales: initiales(u.nom_complet),
    email: u.email,
    role: u.role,
    langue: u.langue,
    telephone: u.telephone,
    secteur: u.secteur,
    posteVise: u.poste_vise,
    specialite: u.specialite,
  };
}
