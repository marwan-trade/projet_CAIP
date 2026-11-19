// Espaces conseiller et administrateur.
import { maintenant } from '../db.js';
import { bool, echec, iso, texte } from '../http.js';
import { initiales, role } from '../gardes.js';
import { emailValide, hacherMotDePasse, jeton } from '../securite.js';
import { etapesDemande, STATUT } from './candidat.js';

const conseiller = role('conseiller');
const admin = role('administrateur');
const H48 = 48 * 3600 * 1000;

function enLigneDepuis() {
  const min = Math.floor(process.uptime() / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h < 48 ? `${h} h` : `${Math.floor(h / 24)} jours`;
}

export default function routesEquipe(routeur, ctx) {
  const { db } = ctx;

  // Une demande est « en retard » quand le candidat attend une réponse depuis plus de 48 h.
  async function demandesDetaillees(where, params) {
    const rows = await db.all(
      `SELECT d.*, c.nom_complet AS candidat_nom, c.email AS candidat_email, k.nom_complet AS conseiller_nom,
              (SELECT m.auteur_id FROM message m WHERE m.demande_id = d.id ORDER BY m.cree_le DESC, m.id DESC LIMIT 1) AS dernier_auteur,
              (SELECT MAX(m.cree_le) FROM message m WHERE m.demande_id = d.id) AS dernier_message,
              (SELECT COUNT(*) FROM message m WHERE m.demande_id = d.id AND m.auteur_id = d.candidat_id AND m.lu_le IS NULL) AS non_lus
       FROM demande_accompagnement d
       JOIN utilisateur c ON c.id = d.candidat_id
       LEFT JOIN utilisateur k ON k.id = d.conseiller_id
       WHERE ${where}
       ORDER BY d.cree_le DESC, d.id DESC`,
      params,
    );
    const limite = maintenant(-H48);
    return rows.map((d) => {
      const attendDepuis = d.dernier_auteur && d.dernier_auteur === d.candidat_id ? d.dernier_message : !d.dernier_auteur ? d.assignee_le : null;
      const enRetard = ['assignee', 'en_cours'].includes(d.statut) && !!attendDepuis && attendDepuis < limite;
      return {
        id: d.id,
        candidatId: d.candidat_id,
        nom: d.candidat_nom,
        email: d.candidat_email,
        initiales: initiales(d.candidat_nom),
        statut: STATUT[d.statut],
        code: d.statut,
        date: iso(d.cree_le),
        assigneeLe: iso(d.assignee_le),
        dernierMessage: iso(d.dernier_message),
        nonLus: Number(d.non_lus),
        enRetard,
        attendDepuis: iso(attendDepuis),
        situation: d.situation,
        objectif: d.objectif,
        dispo: d.disponibilites,
        conseillerId: d.conseiller_id,
        conseiller: d.conseiller_nom,
        etapes: etapesDemande(d, d.conseiller_nom),
      };
    });
  }

  // ---------- Conseiller ----------
  routeur.get('/api/conseiller/demandes', conseiller, async (r) => {
    const moi = r.utilisateur;
    const demandes = await demandesDetaillees('d.conseiller_id = ?', [moi.id]);
    for (const d of demandes) {
      const doc = await db.get(
        'SELECT id, nom_fichier, fichier IS NOT NULL AS a_fichier FROM document WHERE utilisateur_id = ? AND partage = 1 ORDER BY depose_le DESC LIMIT 1',
        [d.candidatId],
      );
      const a = await db.get('SELECT score FROM analyse WHERE utilisateur_id = ? ORDER BY cree_le DESC, id DESC LIMIT 1', [d.candidatId]);
      d.document = doc ? { id: doc.id, nom: doc.nom_fichier, fichier: bool(doc.a_fichier) } : null;
      d.score = a ? Number(a.score) : null;
    }
    const debutMois = `${maintenant().slice(0, 7)}-01 00:00:00`;
    const depuisHier = maintenant(-24 * 3600 * 1000);
    return {
      conseiller: { nom: moi.nom_complet, capacite: Number(moi.capacite), specialite: moi.specialite },
      kpis: {
        ouvertes: demandes.filter((d) => d.code !== 'cloturee').length,
        aTraiter: demandes.filter((d) => d.code !== 'cloturee' && (d.nonLus > 0 || (d.code === 'assignee' && d.assigneeLe && d.assigneeLe.replace('T', ' ').slice(0, 19) >= depuisHier))).length,
        enRetard: demandes.filter((d) => d.enRetard).length,
        clotureesCeMois: Number((await db.get("SELECT COUNT(*) AS n FROM demande_accompagnement WHERE conseiller_id = ? AND statut = 'cloturee' AND cloturee_le >= ?", [moi.id, debutMois])).n),
      },
      demandes,
    };
  });

  routeur.patch('/api/conseiller/demandes/:id', conseiller, async (r) => {
    const d = await db.get('SELECT * FROM demande_accompagnement WHERE id = ? AND conseiller_id = ?', [Number(r.params.id), r.utilisateur.id]);
    if (!d) echec(404, 'Demande introuvable.');
    const statut = r.corps.statut;
    const permis = { assignee: ['en_cours'], en_cours: ['cloturee'], cloturee: ['en_cours'] };
    if (!permis[d.statut]?.includes(statut)) echec(400, 'Changement de statut impossible.');
    const now = maintenant();
    if (statut === 'en_cours') await db.run("UPDATE demande_accompagnement SET statut = 'en_cours', en_cours_le = COALESCE(en_cours_le, ?), cloturee_le = NULL, modifie_le = ? WHERE id = ?", [now, now, d.id]);
    else await db.run("UPDATE demande_accompagnement SET statut = 'cloturee', cloturee_le = ?, modifie_le = ? WHERE id = ?", [now, now, d.id]);
    await ctx.journal(r.utilisateur.id, `demande.${statut}`, `Demande n° ${d.id}`);
    return { ok: true, statut: STATUT[statut] };
  });

  // ---------- Administrateur : indicateurs ----------
  async function conseillers() {
    const rows = await db.all(
      `SELECT u.id, u.nom_complet, u.specialite, u.capacite, u.actif,
              (SELECT COUNT(*) FROM demande_accompagnement d WHERE d.conseiller_id = u.id AND d.statut IN ('assignee', 'en_cours')) AS charge
       FROM utilisateur u WHERE u.role = 'conseiller' ORDER BY u.nom_complet`,
    );
    return rows.map((c) => ({ id: c.id, nom: c.nom_complet, specialite: c.specialite, capacite: Number(c.capacite), charge: Number(c.charge), actif: bool(c.actif) }));
  }

  routeur.get('/api/admin/indicateurs', admin, async (r) => {
    const jours = [7, 30, 90].includes(Number(r.query.periode)) ? Number(r.query.periode) : 30;
    const depuis = maintenant(-jours * 24 * 3600 * 1000);
    const n = async (sql, p) => Number((await db.get(sql, p))?.n || 0);
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

    const comptes = await n("SELECT COUNT(*) AS n FROM utilisateur WHERE role = 'candidat' AND cree_le >= ?", [depuis]);
    const apercu = await n("SELECT COUNT(DISTINCT utilisateur_id) AS n FROM utilisation_modele WHERE action = 'apercu' AND cree_le >= ?", [depuis]);
    const telecharge = await n("SELECT COUNT(DISTINCT utilisateur_id) AS n FROM utilisation_modele WHERE action = 'telecharge' AND cree_le >= ?", [depuis]);
    const actifs = await n("SELECT COUNT(*) AS n FROM utilisateur WHERE role = 'candidat' AND actif = 1 AND (derniere_connexion >= ? OR cree_le >= ?)", [depuis, depuis]);
    const analyses = await n('SELECT COUNT(DISTINCT a.utilisateur_id) AS n FROM analyse a WHERE a.cree_le >= ?', [depuis]);
    const note = await db.get('SELECT AVG(note_utilite) AS moy, COUNT(note_utilite) AS nb FROM analyse WHERE note_utilite IS NOT NULL AND cree_le >= ?', [depuis]);
    const delais = await db.all(
      `SELECT d.assignee_le, (SELECT MIN(m.cree_le) FROM message m WHERE m.demande_id = d.id AND m.auteur_id = d.conseiller_id) AS premiere
       FROM demande_accompagnement d WHERE d.assignee_le IS NOT NULL AND d.assignee_le >= ?`,
      [depuis],
    );
    const heures = delais.filter((d) => d.premiere).map((d) => (Date.parse(`${iso(d.premiere)}`) - Date.parse(`${iso(d.assignee_le)}`)) / 3600000);
    const delaiMoyen = heures.length ? Math.max(0, Math.round(heures.reduce((a, b) => a + b, 0) / heures.length)) : null;

    const tauxModele = pct(telecharge, apercu);
    const tauxAnalyse = pct(analyses, actifs);
    const moyenne = note?.nb ? Number(note.moy) : null;
    const fr = (x) => String(x).replace('.', ',');

    const indicateurs = [
      { label: 'Comptes créés', cible: '≥ 500 à 6 mois', valeur: String(comptes), ok: null },
      { label: 'Modèle → document téléchargé', cible: '≥ 60 %', valeur: tauxModele === null ? '—' : `${tauxModele} %`, ok: tauxModele === null ? null : tauxModele >= 60 },
      { label: 'Candidatures soumises à l’analyse', cible: '≥ 40 % des actifs', valeur: tauxAnalyse === null ? '—' : `${tauxAnalyse} %`, ok: tauxAnalyse === null ? null : tauxAnalyse >= 40 },
      { label: 'Satisfaction recommandations', cible: '≥ 4,0 / 5', valeur: moyenne === null ? '—' : `${fr(moyenne.toFixed(1))} / 5`, ok: moyenne === null ? null : moyenne >= 4 },
      { label: 'Délai moyen de réponse', cible: '≤ 48 h', valeur: delaiMoyen === null ? '—' : `${delaiMoyen} h`, ok: delaiMoyen === null ? null : delaiMoyen <= 48 },
      { label: 'Disponibilité du service', cible: '≥ 99 %', valeur: 'En ligne', ok: null, note: `Sans interruption depuis ${enLigneDepuis()}` },
    ];

    const ouvertes = await demandesDetaillees("d.statut <> 'cloturee'", []);
    const contenus = [
      ['Modèles de CV', await n("SELECT COUNT(*) AS n FROM modele WHERE type = 'cv' AND publie = 1")],
      ['Modèles de lettres', await n("SELECT COUNT(*) AS n FROM modele WHERE type = 'lettre' AND publie = 1")],
      ["Thèmes d'entretien", await n('SELECT COUNT(*) AS n FROM theme_entretien')],
      ['Questions types', await n('SELECT COUNT(*) AS n FROM question_entretien')],
      ['Modules de formation', await n('SELECT COUNT(*) AS n FROM module_formation')],
    ];
    return {
      periode: jours,
      indicateurs,
      enRetard: ouvertes.filter((d) => d.enRetard),
      aAssigner: ouvertes.filter((d) => d.code === 'recue'),
      conseillers: await conseillers(),
      contenus,
    };
  });

  // ---------- Administrateur : assignations ----------
  routeur.get('/api/admin/demandes', admin, async () => ({
    demandes: await demandesDetaillees('1 = 1', []),
    conseillers: await conseillers(),
  }));

  routeur.post('/api/admin/demandes/:id/assigner', admin, async (r) => {
    const d = await db.get('SELECT * FROM demande_accompagnement WHERE id = ?', [Number(r.params.id)]);
    if (!d) echec(404, 'Demande introuvable.');
    if (d.statut === 'cloturee') echec(409, 'Cette demande est clôturée.');
    const c = (await conseillers()).find((x) => x.id === Number(r.corps.conseillerId));
    if (!c || !c.actif) echec(400, 'Choisissez un conseiller actif.');
    if (c.id === d.conseiller_id) echec(409, 'Ce conseiller suit déjà cette demande.');
    if (c.charge >= c.capacite) echec(409, `${c.nom} a déjà ${c.charge} demandes sur ${c.capacite}.`);
    const now = maintenant();
    await db.run("UPDATE demande_accompagnement SET conseiller_id = ?, statut = 'assignee', assignee_le = ?, modifie_le = ? WHERE id = ?", [c.id, now, now, d.id]);
    await ctx.journal(r.utilisateur.id, d.conseiller_id ? 'demande.reassignee' : 'demande.assignee', `Demande n° ${d.id} → ${c.nom}`);
    return { ok: true };
  });

  // ---------- Administrateur : comptes ----------
  routeur.get('/api/admin/comptes', admin, async (r) => {
    const q = `%${texte(r.query.q, 100).toLowerCase()}%`;
    const roleFiltre = ['candidat', 'conseiller', 'administrateur'].includes(r.query.role) ? r.query.role : null;
    const rows = await db.all(
      `SELECT id, nom_complet, email, role, specialite, capacite, actif, derniere_connexion, cree_le FROM utilisateur
       WHERE (LOWER(nom_complet) LIKE ? OR email LIKE ?) ${roleFiltre ? 'AND role = ?' : ''}
       ORDER BY cree_le DESC LIMIT 200`,
      roleFiltre ? [q, q, roleFiltre] : [q, q],
    );
    return rows.map((u) => ({
      id: u.id, nom: u.nom_complet, email: u.email, role: u.role, specialite: u.specialite, capacite: Number(u.capacite),
      actif: bool(u.actif), derniereConnexion: iso(u.derniere_connexion), creeLe: iso(u.cree_le), initiales: initiales(u.nom_complet),
    }));
  });

  routeur.post('/api/admin/comptes', admin, async (r) => {
    const nom = texte(r.corps.nom, 120);
    const email = texte(r.corps.email, 255).toLowerCase();
    const roleNouveau = ['conseiller', 'administrateur'].includes(r.corps.role) ? r.corps.role : null;
    const champs = {};
    if (!nom) champs.nom = 'Indiquez le nom.';
    if (!emailValide(email)) champs.email = 'Adresse e-mail invalide.';
    if (!roleNouveau) champs.role = 'Choisissez un rôle.';
    if (!champs.email && (await db.get('SELECT id FROM utilisateur WHERE email = ?', [email]))) champs.email = 'Un compte existe déjà avec cette adresse.';
    if (Object.keys(champs).length) echec(400, 'Vérifiez le formulaire.', champs);
    // Mot de passe provisoire, affiché une seule fois à l'administrateur.
    const provisoire = `Caip-${jeton().slice(0, 10)}`;
    const capacite = Math.min(30, Math.max(1, Number(r.corps.capacite) || 8));
    const { insertId } = await db.run(
      'INSERT INTO utilisateur (nom_complet, email, mot_de_passe_hash, role, specialite, capacite, cgu_acceptees_le, cree_le, modifie_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, email, await hacherMotDePasse(provisoire), roleNouveau, texte(r.corps.specialite, 120) || null, capacite, maintenant(), maintenant(), maintenant()],
    );
    await ctx.journal(r.utilisateur.id, 'compte.cree', `${roleNouveau} : ${email}`);
    return { id: insertId, motDePasseProvisoire: provisoire };
  });

  routeur.patch('/api/admin/comptes/:id', admin, async (r) => {
    const u = await db.get('SELECT * FROM utilisateur WHERE id = ?', [Number(r.params.id)]);
    if (!u) echec(404, 'Compte introuvable.');
    const c = r.corps;
    if (u.id === r.utilisateur.id && ('actif' in c || 'role' in c)) echec(400, 'Vous ne pouvez pas modifier votre propre accès.');
    const actif = 'actif' in c ? (c.actif ? 1 : 0) : Number(u.actif);
    const nouveauRole = ['candidat', 'conseiller', 'administrateur'].includes(c.role) ? c.role : u.role;
    if (u.role === 'conseiller' && (!actif || nouveauRole !== 'conseiller')) {
      const ouvertes = await db.get("SELECT COUNT(*) AS n FROM demande_accompagnement WHERE conseiller_id = ? AND statut IN ('assignee', 'en_cours')", [u.id]);
      if (Number(ouvertes.n) > 0) echec(409, `Réassignez d’abord les ${ouvertes.n} demandes ouvertes de ${u.nom_complet}.`);
    }
    await db.run('UPDATE utilisateur SET actif = ?, role = ?, specialite = ?, capacite = ?, modifie_le = ? WHERE id = ?', [
      actif, nouveauRole, 'specialite' in c ? texte(c.specialite, 120) || null : u.specialite,
      'capacite' in c ? Math.min(30, Math.max(1, Number(c.capacite) || 8)) : u.capacite, maintenant(), u.id,
    ]);
    if (!actif) await db.run('DELETE FROM session_utilisateur WHERE utilisateur_id = ?', [u.id]);
    await ctx.journal(r.utilisateur.id, 'compte.modifie', `${u.email}${'actif' in c ? (actif ? ' réactivé' : ' désactivé') : ''}${nouveauRole !== u.role ? ` → ${nouveauRole}` : ''}`);
    return { ok: true };
  });

  // ---------- Administrateur : contenus ----------
  routeur.get('/api/admin/contenus', admin, async () => {
    const modeles = await db.all('SELECT id, type, nom, secteur, style, publie FROM modele ORDER BY type, id');
    const themes = await db.all('SELECT * FROM theme_entretien ORDER BY ordre, id');
    const questions = await db.all('SELECT * FROM question_entretien ORDER BY ordre, id');
    const modules = await db.all('SELECT m.id, m.numero, m.titre, (SELECT COUNT(*) FROM question_quiz q WHERE q.module_id = m.id) AS questions FROM module_formation m ORDER BY m.numero');
    const partenaires = await db.all('SELECT id, nom, site_url, visible FROM centre_partenaire ORDER BY ordre, nom');
    return {
      modeles: modeles.map((m) => ({ ...m, publie: bool(m.publie) })),
      themes: themes.map((t) => ({ id: t.id, label: t.label, questions: questions.filter((q) => q.theme_id === t.id).map((q) => ({ id: q.id, question: q.question, attendu: q.attendu, conseil: q.conseil })) })),
      modules: modules.map((m) => ({ id: m.id, numero: Number(m.numero), titre: m.titre, questions: Number(m.questions) })),
      partenaires: partenaires.map((p) => ({ id: p.id, nom: p.nom, site: p.site_url, visible: bool(p.visible) })),
    };
  });

  routeur.post('/api/admin/modeles', admin, async (r) => {
    const c = r.corps;
    const type = c.type === 'lettre' ? 'lettre' : 'cv';
    const nom = texte(c.nom, 120);
    if (!nom) echec(400, 'Vérifiez le formulaire.', { nom: 'Indiquez le nom du modèle.' });
    const style = type === 'lettre' ? 'lettre' : c.style === 'colonne' ? 'colonne' : 'classique';
    const contenu = texte(c.contenu, 20000) || (type === 'cv' ? '# {{nom}}\n{{poste}}\n{{email}} · {{telephone}}\n\n# Expérience\n\n# Formation\n\n# Compétences\n\n# Langues' : 'Madame, Monsieur,\n\n…\n\n{{nom}}');
    const { insertId } = await db.run('INSERT INTO modele (type, nom, secteur, style, contenu, cree_le) VALUES (?, ?, ?, ?, ?, ?)', [type, nom, texte(c.secteur, 80) || 'Tous secteurs', style, contenu, maintenant()]);
    await ctx.journal(r.utilisateur.id, 'contenu.publie', `Modèle « ${nom} »`);
    return { id: insertId };
  });

  routeur.patch('/api/admin/modeles/:id', admin, async (r) => {
    const { changes } = await db.run('UPDATE modele SET publie = ? WHERE id = ?', [r.corps.publie ? 1 : 0, Number(r.params.id)]);
    if (!changes) echec(404, 'Modèle introuvable.');
    await ctx.journal(r.utilisateur.id, r.corps.publie ? 'contenu.publie' : 'contenu.retire', `Modèle n° ${r.params.id}`);
    return { ok: true };
  });

  routeur.delete('/api/admin/modeles/:id', admin, async (r) => {
    const { changes } = await db.run('DELETE FROM modele WHERE id = ?', [Number(r.params.id)]);
    if (!changes) echec(404, 'Modèle introuvable.');
    await ctx.journal(r.utilisateur.id, 'contenu.supprime', `Modèle n° ${r.params.id}`);
    return { ok: true };
  });

  routeur.post('/api/admin/questions-entretien', admin, async (r) => {
    const c = r.corps;
    const theme = await db.get('SELECT id FROM theme_entretien WHERE id = ?', [Number(c.themeId)]);
    const champs = {};
    if (!theme) champs.themeId = 'Choisissez un thème.';
    if (!texte(c.question)) champs.question = 'Indiquez la question.';
    if (!texte(c.conseil)) champs.conseil = 'Indiquez un conseil.';
    if (Object.keys(champs).length) echec(400, 'Vérifiez le formulaire.', champs);
    const ordre = Number((await db.get('SELECT COALESCE(MAX(ordre), 0) AS n FROM question_entretien WHERE theme_id = ?', [theme.id])).n) + 1;
    const { insertId } = await db.run('INSERT INTO question_entretien (theme_id, question, attendu, conseil, ordre) VALUES (?, ?, ?, ?, ?)', [theme.id, texte(c.question, 300), texte(c.attendu, 1000) || '—', texte(c.conseil, 1000), ordre]);
    await ctx.journal(r.utilisateur.id, 'contenu.publie', `Question d’entretien n° ${insertId}`);
    return { id: insertId };
  });

  routeur.delete('/api/admin/questions-entretien/:id', admin, async (r) => {
    const { changes } = await db.run('DELETE FROM question_entretien WHERE id = ?', [Number(r.params.id)]);
    if (!changes) echec(404, 'Question introuvable.');
    await ctx.journal(r.utilisateur.id, 'contenu.supprime', `Question d’entretien n° ${r.params.id}`);
    return { ok: true };
  });

  routeur.post('/api/admin/partenaires', admin, async (r) => {
    const nom = texte(r.corps.nom, 150);
    const site = texte(r.corps.site, 500);
    const champs = {};
    if (!nom) champs.nom = 'Indiquez le nom du centre.';
    if (site && !/^https?:\/\//.test(site)) champs.site = 'L’adresse doit commencer par https://';
    if (!champs.nom && (await db.get('SELECT id FROM centre_partenaire WHERE LOWER(nom) = ?', [nom.toLowerCase()]))) champs.nom = 'Ce centre existe déjà.';
    if (Object.keys(champs).length) echec(400, 'Vérifiez le formulaire.', champs);
    const ordre = Number((await db.get('SELECT COALESCE(MAX(ordre), 0) AS n FROM centre_partenaire')).n) + 1;
    const { insertId } = await db.run('INSERT INTO centre_partenaire (nom, site_url, ordre, cree_le) VALUES (?, ?, ?, ?)', [nom, site || null, ordre, maintenant()]);
    await ctx.journal(r.utilisateur.id, 'partenaire.ajoute', nom);
    return { id: insertId };
  });

  routeur.patch('/api/admin/partenaires/:id', admin, async (r) => {
    const { changes } = await db.run('UPDATE centre_partenaire SET visible = ? WHERE id = ?', [r.corps.visible ? 1 : 0, Number(r.params.id)]);
    if (!changes) echec(404, 'Partenaire introuvable.');
    return { ok: true };
  });

  routeur.delete('/api/admin/partenaires/:id', admin, async (r) => {
    const { changes } = await db.run('DELETE FROM centre_partenaire WHERE id = ?', [Number(r.params.id)]);
    if (!changes) echec(404, 'Partenaire introuvable.');
    await ctx.journal(r.utilisateur.id, 'partenaire.supprime', `Partenaire n° ${r.params.id}`);
    return { ok: true };
  });

  // ---------- Administrateur : journal d'audit ----------
  routeur.get('/api/admin/audit', admin, async (r) => {
    const filtre = texte(r.query.action, 40);
    const rows = await db.all(
      `SELECT j.id, j.action, j.detail, j.cree_le, u.nom_complet, u.role FROM journal_audit j
       LEFT JOIN utilisateur u ON u.id = j.utilisateur_id
       ${filtre ? 'WHERE j.action LIKE ?' : ''} ORDER BY j.cree_le DESC, j.id DESC LIMIT 200`,
      filtre ? [`${filtre}%`] : [],
    );
    return rows.map((j) => ({ id: j.id, action: j.action, detail: j.detail, date: iso(j.cree_le), auteur: j.nom_complet || 'Système', role: j.role }));
  });
}
