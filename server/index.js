// Serveur CAIP : API JSON sous /api et interface React (dossier dist/).
// Démarrage : `npm start` (après `npm run build`). Variables : voir .env.example.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrirBase, maintenant } from './db.js';
import { creerRouteur, ErreurHttp, json, lireCorps } from './http.js';
import { cookie, empreinte, lireCookies } from './securite.js';
import routesAuth from './routes/auth.js';
import routesCandidat from './routes/candidat.js';
import routesEquipe from './routes/equipe.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ICI, '..', 'dist');
const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
export const COOKIE = 'caip_session';
export const DUREE_SESSION = 7 * 24 * 3600; // 7 jours

const db = await ouvrirBase();
const routeur = creerRouteur();

const ctx = {
  db,
  secure: PROD,
  async journal(utilisateurId, action, detail = null) {
    await db.run('INSERT INTO journal_audit (utilisateur_id, action, detail, cree_le) VALUES (?, ?, ?, ?)', [utilisateurId, action, detail ? String(detail).slice(0, 500) : null, maintenant()]);
  },
  cookieSession: (valeur, maxAge) => cookie(COOKIE, valeur, { maxAge, secure: PROD }),
};

routesAuth(routeur, ctx);
routesCandidat(routeur, ctx);
routesEquipe(routeur, ctx);

// Utilisateur connecté, d'après le cookie de session.
async function utilisateurCourant(req) {
  const valeur = lireCookies(req)[COOKIE];
  if (!valeur) return null;
  const u = await db.get(
    `SELECT u.* FROM session_utilisateur s JOIN utilisateur u ON u.id = s.utilisateur_id
     WHERE s.jeton_hash = ? AND s.expire_le > ? AND u.actif = 1`,
    [empreinte(valeur), maintenant()],
  );
  return u;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function servirFichier(req, res, chemin) {
  let fichier = path.normalize(path.join(DIST, chemin));
  if (!fichier.startsWith(DIST)) fichier = path.join(DIST, 'index.html');
  if (!existsSync(fichier) || statSync(fichier).isDirectory()) fichier = path.join(DIST, 'index.html');
  if (!existsSync(fichier)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end("L'interface n'est pas encore construite : lancez « npm run build ».");
  }
  const ext = path.extname(fichier);
  const immuable = chemin.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': immuable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(fichier).pipe(res);
}

const serveur = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const url = new URL(req.url, 'http://local');

  if (!url.pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { erreur: 'Méthode non autorisée.' });
    return servirFichier(req, res, decodeURIComponent(url.pathname));
  }

  try {
    const trouve = routeur.trouver(req.method, url.pathname);
    if (!trouve) return json(res, 404, { erreur: 'Adresse inconnue.' });
    if (trouve === 'methode') return json(res, 405, { erreur: 'Méthode non autorisée.' });

    // Protection CSRF : les écritures doivent être du JSON envoyé par notre interface.
    if (req.method !== 'GET' && !String(req.headers['content-type'] || '').includes('application/json')) {
      return json(res, 415, { erreur: 'Format de requête non accepté.' });
    }

    const r = {
      req,
      res,
      params: trouve.params,
      query: Object.fromEntries(url.searchParams),
      corps: req.method === 'GET' ? {} : await lireCorps(req),
      utilisateur: await utilisateurCourant(req),
      ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
    };
    for (const h of trouve.handlers) {
      const resultat = await h(r);
      if (res.writableEnded) return;
      if (resultat !== undefined) return json(res, 200, resultat);
    }
    if (!res.writableEnded) json(res, 204, {});
  } catch (e) {
    if (e instanceof ErreurHttp) return json(res, e.status, { erreur: e.message, champs: e.champs });
    console.error('[caip]', e);
    json(res, 500, { erreur: 'Une erreur est survenue. Réessayez dans un instant.' });
  }
});

serveur.listen(PORT, () => console.log(`[caip] Serveur prêt sur le port ${PORT} (base : ${db.client}).`));

const arreter = () => serveur.close(() => Promise.resolve(db.close()).finally(() => process.exit(0)));
process.on('SIGTERM', arreter);
process.on('SIGINT', arreter);
