// Comptes : inscription, connexion, déconnexion, mot de passe oublié.
import { maintenant } from '../db.js';
import { echec, texte } from '../http.js';
import { connecte, publicUtilisateur } from '../gardes.js';
import { emailValide, empreinte, hacherMotDePasse, jeton, MOT_DE_PASSE_MIN, verifierMotDePasse } from '../securite.js';

const DUREE = 7 * 24 * 3600;
const ESSAIS_MAX = 5;
const BLOCAGE_MIN = 15;

export default function routesAuth(routeur, ctx) {
  const { db } = ctx;

  async function ouvrirSession(r, u) {
    const valeur = jeton();
    await db.run('INSERT INTO session_utilisateur (jeton_hash, utilisateur_id, expire_le, cree_le) VALUES (?, ?, ?, ?)', [empreinte(valeur), u.id, maintenant(DUREE * 1000), maintenant()]);
    await db.run('UPDATE utilisateur SET derniere_connexion = ?, echecs_connexion = 0, bloque_jusqu_au = NULL WHERE id = ?', [maintenant(), u.id]);
    // Ménage : sessions expirées.
    await db.run('DELETE FROM session_utilisateur WHERE expire_le < ?', [maintenant()]);
    r.res.setHeader('Set-Cookie', ctx.cookieSession(valeur, DUREE));
  }

  routeur.get('/api/sante', async () => {
    await db.get('SELECT 1 AS ok');
    return { ok: true, base: db.client };
  });

  routeur.get('/api/partenaires', async () => {
    const rows = await db.all('SELECT nom, logo_url, site_url FROM centre_partenaire WHERE visible = 1 ORDER BY ordre, nom');
    return rows.map((p) => ({ nom: p.nom, logo: p.logo_url, site: p.site_url }));
  });

  routeur.get('/api/auth/moi', connecte, (r) => publicUtilisateur(r.utilisateur));

  routeur.post('/api/auth/inscription', async (r) => {
    const nom = texte(r.corps.nom, 120);
    const email = texte(r.corps.email, 255).toLowerCase();
    const mdp = String(r.corps.password || '');
    const champs = {};
    if (!nom) champs.nom = 'Indiquez votre nom.';
    if (!emailValide(email)) champs.email = 'Adresse e-mail invalide.';
    if (mdp.length < MOT_DE_PASSE_MIN) champs.password = '8 caractères minimum.';
    if (!r.corps.cgu) champs.cgu = 'Merci d’accepter la politique de confidentialité.';
    if (Object.keys(champs).length) echec(400, 'Vérifiez le formulaire.', champs);
    if (await db.get('SELECT id FROM utilisateur WHERE email = ?', [email])) {
      echec(409, 'Un compte existe déjà avec cette adresse.', { email: 'Un compte existe déjà avec cette adresse. Connectez-vous ou choisissez « Mot de passe oublié ».' });
    }
    const langue = r.corps.langue === 'en' ? 'en' : 'fr';
    const { insertId } = await db.run(
      'INSERT INTO utilisateur (nom_complet, email, mot_de_passe_hash, role, langue, cgu_acceptees_le, cree_le, modifie_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, email, await hacherMotDePasse(mdp), 'candidat', langue, maintenant(), maintenant(), maintenant()],
    );
    const u = await db.get('SELECT * FROM utilisateur WHERE id = ?', [insertId]);
    await ouvrirSession(r, u);
    await ctx.journal(u.id, 'compte.cree', `Inscription de ${email}`);
    return publicUtilisateur(u);
  });

  routeur.post('/api/auth/connexion', async (r) => {
    const email = texte(r.corps.email, 255).toLowerCase();
    const mdp = String(r.corps.password || '');
    const u = await db.get('SELECT * FROM utilisateur WHERE email = ?', [email]);
    const refus = () => echec(401, 'E-mail ou mot de passe incorrect.');
    if (!u) {
      await hacherMotDePasse(mdp); // même durée de réponse, que le compte existe ou non
      refus();
    }
    if (u.bloque_jusqu_au && u.bloque_jusqu_au > maintenant()) {
      echec(429, `Trop d’essais. Réessayez dans ${BLOCAGE_MIN} minutes ou choisissez « Mot de passe oublié ».`);
    }
    if (!(await verifierMotDePasse(mdp, u.mot_de_passe_hash))) {
      const echecs = Number(u.echecs_connexion) + 1;
      const bloque = echecs >= ESSAIS_MAX ? maintenant(BLOCAGE_MIN * 60000) : null;
      await db.run('UPDATE utilisateur SET echecs_connexion = ?, bloque_jusqu_au = ? WHERE id = ?', [bloque ? 0 : echecs, bloque, u.id]);
      if (bloque) await ctx.journal(u.id, 'compte.bloque', `${ESSAIS_MAX} essais de connexion échoués`);
      refus();
    }
    if (!Number(u.actif)) echec(403, 'Ce compte est désactivé. Contactez l’administrateur.');
    await ouvrirSession(r, u);
    if (u.role !== 'candidat') await ctx.journal(u.id, 'connexion', `Connexion ${u.role}`);
    return publicUtilisateur(u);
  });

  routeur.post('/api/auth/deconnexion', async (r) => {
    const valeur = (r.req.headers.cookie || '').match(/caip_session=([^;]+)/)?.[1];
    if (valeur) await db.run('DELETE FROM session_utilisateur WHERE jeton_hash = ?', [empreinte(decodeURIComponent(valeur))]);
    r.res.setHeader('Set-Cookie', ctx.cookieSession('', 0));
    return { ok: true };
  });

  routeur.post('/api/auth/mot-de-passe-oublie', async (r) => {
    const email = texte(r.corps.email, 255).toLowerCase();
    if (!emailValide(email)) echec(400, 'Adresse e-mail invalide.', { email: 'Adresse e-mail invalide.' });
    const u = await db.get('SELECT id FROM utilisateur WHERE email = ? AND actif = 1', [email]);
    let lienDemo = null;
    if (u) {
      const valeur = jeton();
      await db.run('INSERT INTO reinitialisation_mot_de_passe (utilisateur_id, jeton_hash, expire_le, cree_le) VALUES (?, ?, ?, ?)', [u.id, empreinte(valeur), maintenant(3600 * 1000), maintenant()]);
      const lien = `/reinitialiser?jeton=${valeur}`;
      // Pas encore de service d'envoi d'e-mails : le lien est écrit dans les journaux du serveur
      // et, en démonstration, renvoyé à l'écran.
      console.log(`[caip] Lien de réinitialisation pour ${email} : ${lien}`);
      if (process.env.LIEN_REINITIALISATION_A_L_ECRAN !== 'non') lienDemo = lien;
    }
    // Même réponse que le compte existe ou non.
    return { ok: true, lienDemo };
  });

  routeur.post('/api/auth/reinitialiser', async (r) => {
    const valeur = String(r.corps.jeton || '');
    const mdp = String(r.corps.password || '');
    if (mdp.length < MOT_DE_PASSE_MIN) echec(400, 'Vérifiez le formulaire.', { password: '8 caractères minimum.' });
    const ligne = await db.get(
      'SELECT * FROM reinitialisation_mot_de_passe WHERE jeton_hash = ? AND utilise_le IS NULL AND expire_le > ?',
      [empreinte(valeur), maintenant()],
    );
    if (!ligne) echec(400, 'Ce lien n’est plus valable. Demandez-en un nouveau.');
    await db.tx(async (t) => {
      await t.run('UPDATE utilisateur SET mot_de_passe_hash = ?, echecs_connexion = 0, bloque_jusqu_au = NULL, modifie_le = ? WHERE id = ?', [await hacherMotDePasse(mdp), maintenant(), ligne.utilisateur_id]);
      await t.run('UPDATE reinitialisation_mot_de_passe SET utilise_le = ? WHERE id = ?', [maintenant(), ligne.id]);
      await t.run('DELETE FROM session_utilisateur WHERE utilisateur_id = ?', [ligne.utilisateur_id]);
    });
    await ctx.journal(ligne.utilisateur_id, 'mot_de_passe.reinitialise', null);
    return { ok: true };
  });
}
