// Accès à l'API du serveur CAIP (server/). Toutes les pages passent par ici.
// Le cookie de session est envoyé automatiquement (même origine).

export const API_URL = import.meta.env?.VITE_API_URL ?? '';

export class ErreurApi extends Error {
  constructor(status, message, champs) {
    super(message);
    this.status = status;
    this.champs = champs || {};
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErreurApi(0, 'Connexion impossible. Vérifiez votre réseau et réessayez.');
  }
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('caip:deconnecte'));
    throw new ErreurApi(res.status, data.erreur || `Erreur ${res.status}`, data.champs);
  }
  return data;
}

const get = (p) => request(p);
const post = (p, body = {}) => request(p, { method: 'POST', body });
const patch = (p, body = {}) => request(p, { method: 'PATCH', body });
const del = (p, body = {}) => request(p, { method: 'DELETE', body });

// Lit un fichier choisi par l'utilisateur et le renvoie en base64.
export function fichierEnBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ nom: file.name, contenu: String(r.result).split(',')[1] || '' });
    r.onerror = () => reject(new ErreurApi(0, `Impossible de lire « ${file.name} ».`));
    r.readAsDataURL(file);
  });
}

export const api = {
  // Comptes
  moi: () => get('/api/auth/moi'),
  connexion: (email, password) => post('/api/auth/connexion', { email, password }),
  inscription: (donnees) => post('/api/auth/inscription', donnees),
  deconnexion: () => post('/api/auth/deconnexion'),
  motDePasseOublie: (email) => post('/api/auth/mot-de-passe-oublie', { email }),
  reinitialiser: (jeton, password) => post('/api/auth/reinitialiser', { jeton, password }),
  partenaires: () => get('/api/partenaires'),

  // Candidat
  tableauDeBord: () => get('/api/candidat/tableau-de-bord'),
  analyses: () => get('/api/candidat/analyses'),
  rapport: (id = 'derniere') => get(`/api/candidat/analyses/${id}`),
  lancerAnalyse: (donnees) => post('/api/candidat/analyses', donnees),
  majRecommandation: (id, champs) => patch(`/api/candidat/recommandations/${id}`, champs),
  noterAnalyse: (id, note) => post(`/api/candidat/analyses/${id}/note`, { note }),
  modeles: () => get('/api/modeles'),
  modele: (id) => get(`/api/modeles/${id}`),
  lienModele: (id) => `${API_URL}/api/modeles/${id}/telecharger`,
  entretiens: () => get('/api/entretiens'),
  formation: () => get('/api/candidat/formation'),
  repondreQuiz: (moduleId, choix) => post('/api/candidat/formation/repondre', { moduleId, choix }),
  accompagnement: () => get('/api/candidat/accompagnement'),
  nouvelleDemande: (donnees) => post('/api/candidat/accompagnement', donnees),
  messages: (demandeId) => get(`/api/demandes/${demandeId}/messages`),
  envoyerMessage: (demandeId, texte) => post(`/api/demandes/${demandeId}/messages`, { texte }),
  profil: () => get('/api/candidat/profil'),
  majProfil: (champs) => patch('/api/candidat/profil', champs),
  partagerDocument: (id, partage) => patch(`/api/documents/${id}`, { partage }),
  supprimerDocument: (id) => del(`/api/documents/${id}`),
  lienDocument: (id) => `${API_URL}/api/documents/${id}/fichier`,
  lienExport: () => `${API_URL}/api/candidat/export`,
  supprimerCompte: (password) => del('/api/candidat/compte', { password }),

  // Conseiller
  demandesConseiller: () => get('/api/conseiller/demandes'),
  changerStatut: (id, statut) => patch(`/api/conseiller/demandes/${id}`, { statut }),

  // Administrateur
  indicateurs: (periode = 30) => get(`/api/admin/indicateurs?periode=${periode}`),
  demandesAdmin: () => get('/api/admin/demandes'),
  assigner: (id, conseillerId) => post(`/api/admin/demandes/${id}/assigner`, { conseillerId }),
  comptes: (q = '', role = '') => get(`/api/admin/comptes?q=${encodeURIComponent(q)}&role=${role}`),
  creerCompte: (donnees) => post('/api/admin/comptes', donnees),
  majCompte: (id, champs) => patch(`/api/admin/comptes/${id}`, champs),
  contenus: () => get('/api/admin/contenus'),
  creerModele: (donnees) => post('/api/admin/modeles', donnees),
  publierModele: (id, publie) => patch(`/api/admin/modeles/${id}`, { publie }),
  supprimerModele: (id) => del(`/api/admin/modeles/${id}`),
  creerQuestion: (donnees) => post('/api/admin/questions-entretien', donnees),
  supprimerQuestion: (id) => del(`/api/admin/questions-entretien/${id}`),
  creerPartenaire: (donnees) => post('/api/admin/partenaires', donnees),
  afficherPartenaire: (id, visible) => patch(`/api/admin/partenaires/${id}`, { visible }),
  supprimerPartenaire: (id) => del(`/api/admin/partenaires/${id}`),
  audit: (action = '') => get(`/api/admin/audit?action=${encodeURIComponent(action)}`),
};
