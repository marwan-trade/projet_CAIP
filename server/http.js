// Mini-routeur HTTP sans dépendance : routes, lecture du JSON, réponses.

export class ErreurHttp extends Error {
  constructor(status, message, champs) {
    super(message);
    this.status = status;
    this.champs = champs;
  }
}

export const echec = (status, message, champs) => {
  throw new ErreurHttp(status, message, champs);
};

export function creerRouteur() {
  const routes = [];
  const ajouter = (methode) => (motif, ...handlers) => {
    const noms = [];
    const re = new RegExp(
      `^${motif.replace(/:(\w+)/g, (_, n) => {
        noms.push(n);
        return '([^/]+)';
      })}/?$`,
    );
    routes.push({ methode, re, noms, handlers });
  };
  return {
    get: ajouter('GET'),
    post: ajouter('POST'),
    patch: ajouter('PATCH'),
    delete: ajouter('DELETE'),
    trouver(methode, chemin) {
      let cheminConnu = false;
      for (const r of routes) {
        const m = r.re.exec(chemin);
        if (!m) continue;
        cheminConnu = true;
        if (r.methode !== methode) continue;
        const params = Object.fromEntries(r.noms.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
        return { handlers: r.handlers, params };
      }
      return cheminConnu ? 'methode' : null;
    },
  };
}

const LIMITE = 16 * 1024 * 1024; // deux fichiers de 5 Mo encodés en base64

export function lireCorps(req) {
  return new Promise((resolve, reject) => {
    const morceaux = [];
    let taille = 0;
    req.on('data', (c) => {
      taille += c.length;
      if (taille > LIMITE) {
        reject(new ErreurHttp(413, 'Envoi trop volumineux.'));
        req.destroy();
        return;
      }
      morceaux.push(c);
    });
    req.on('end', () => {
      if (!morceaux.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(morceaux).toString('utf8')));
      } catch {
        reject(new ErreurHttp(400, 'Requête illisible.'));
      }
    });
    req.on('error', reject);
  });
}

export function json(res, status, data, entetes = {}) {
  const corps = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...entetes,
  });
  res.end(corps);
}

// Convertit « 2026-11-19 08:30:00 » (UTC) en ISO pour le navigateur.
export const iso = (d) => (d ? `${String(d).replace(' ', 'T').slice(0, 19)}Z` : null);
export const bool = (v) => Number(v) === 1 || v === true;
export const texte = (v, max = 500) => String(v ?? '').trim().slice(0, max);
