// Espace candidat, et routes partagées (modèles, entretiens, messages, documents).
import { maintenant } from '../db.js';
import { bool, echec, iso, texte } from '../http.js';
import { connecte, initiales, publicUtilisateur, role } from '../gardes.js';
import { emailValide, verifierMotDePasse } from '../securite.js';
import { analyser } from '../analyse.js';
import { extraireTexte, typeReel } from '../extraction.js';

const candidat = role('candidat');
const PRIORITE = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };
const MAX_FICHIER = 5 * 1024 * 1024;
const MIME = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

// Étapes d'une demande d'accompagnement, pour la frise de suivi.
export function etapesDemande(d, nomConseiller) {
  const ordre = ['recue', 'assignee', 'en_cours', 'cloturee'];
  const rang = ordre.indexOf(d.statut);
  const etat = (i) => (i < rang || (i === rang && d.statut === 'cloturee') ? 'fait' : i === rang ? 'en-cours' : 'a-venir');
  return [
    { label: 'Reçue', quand: iso(d.cree_le), etat: rang === 0 ? 'en-cours' : 'fait' },
    { label: nomConseiller ? `Assignée à ${nomConseiller}` : 'Assignée', quand: iso(d.assignee_le), etat: etat(1) },
    { label: 'En cours', quand: iso(d.en_cours_le), etat: etat(2) },
    { label: 'Clôturée', quand: iso(d.cloturee_le), etat: etat(3) },
  ];
}

export const STATUT = { recue: 'Reçue', assignee: 'Assignée', en_cours: 'En cours', cloturee: 'Clôturée' };

export default function routesCandidat(routeur, ctx) {
  const { db } = ctx;

  // ---------- Données communes ----------
  async function modulesDe(uid) {
    const rows = await db.all(
      `SELECT m.id, m.numero, m.titre, p.statut, p.question_courante,
              (SELECT COUNT(*) FROM question_quiz q WHERE q.module_id = m.id) AS total
       FROM module_formation m
       LEFT JOIN progression_module p ON p.module_id = m.id AND p.utilisateur_id = ?
       ORDER BY m.numero`,
      [uid],
    );
    return rows.map((m) => ({
      id: m.id,
      n: Number(m.numero),
      titre: m.titre,
      etat: m.statut === 'valide' ? 'valide' : m.statut === 'en_cours' ? 'en-cours' : 'a-venir',
      question: Number(m.question_courante || 1),
      total: Number(m.total),
    }));
  }

  async function analysesDe(uid) {
    const rows = await db.all(
      'SELECT id, poste_vise, score, lettre_id, cree_le FROM analyse WHERE utilisateur_id = ? ORDER BY cree_le DESC, id DESC',
      [uid],
    );
    return rows.map((a, i) => ({
      id: a.id,
      date: iso(a.cree_le),
      version: rows.length - i,
      document: `${a.lettre_id ? 'CV + lettre' : 'CV'} (v${rows.length - i})`,
      poste: a.poste_vise,
      score: Number(a.score),
    }));
  }

  async function derniereDemande(uid) {
    return db.get(
      `SELECT d.*, c.nom_complet AS conseiller_nom, c.specialite AS conseiller_specialite
       FROM demande_accompagnement d LEFT JOIN utilisateur c ON c.id = d.conseiller_id
       WHERE d.candidat_id = ? ORDER BY d.cree_le DESC, d.id DESC LIMIT 1`,
      [uid],
    );
  }

  const conseillerPublic = (d) =>
    d?.conseiller_id ? { nom: d.conseiller_nom, initiales: initiales(d.conseiller_nom), specialite: d.conseiller_specialite || 'Accompagnement' } : null;

  // ---------- Tableau de bord ----------
  routeur.get('/api/candidat/tableau-de-bord', candidat, async (r) => {
    const u = r.utilisateur;
    const [docs, analyses, modules, demande] = await Promise.all([
      db.all('SELECT type, COUNT(*) AS n FROM document WHERE utilisateur_id = ? GROUP BY type', [u.id]),
      analysesDe(u.id),
      modulesDe(u.id),
      derniereDemande(u.id),
    ]);
    const a = (t) => docs.some((d) => d.type === t && Number(d.n) > 0);
    const faits = [a('cv'), a('lettre'), analyses.length > 0, modules[2]?.etat === 'valide', modules.length > 0 && modules.every((m) => m.etat === 'valide')];
    const labels = [['cv', 'CV'], ['lettre', 'Lettre'], ['analyse', 'Analyse'], ['entretien', 'Entretien'], ['formation', 'Formation']];
    let premier = true;
    const parcours = labels.map(([id, label], i) => {
      if (faits[i]) return { id, label, etat: 'fait' };
      const etat = premier ? 'en-cours' : 'a-venir';
      premier = false;
      return { id, label, etat };
    });
    let recommandationsPrioritaires = 0;
    if (analyses[0]) {
      const r0 = await db.get("SELECT COUNT(*) AS n FROM recommandation WHERE analyse_id = ? AND priorite = 'haute' AND corrigee_le IS NULL", [analyses[0].id]);
      recommandationsPrioritaires = Number(r0.n);
    }
    return {
      candidat: publicUtilisateur(u),
      parcours,
      analyses,
      modules,
      accompagnement: demande ? { statut: STATUT[demande.statut], conseiller: conseillerPublic(demande) } : null,
      recommandationsPrioritaires,
    };
  });

  // ---------- Analyses ----------
  routeur.get('/api/candidat/analyses', candidat, (r) => analysesDe(r.utilisateur.id));

  routeur.get('/api/candidat/analyses/:id', candidat, async (r) => {
    const uid = r.utilisateur.id;
    const toutes = await analysesDe(uid);
    if (!toutes.length) return { vide: true };
    const id = r.params.id === 'derniere' ? toutes[0].id : Number(r.params.id);
    const a = await db.get('SELECT * FROM analyse WHERE id = ? AND utilisateur_id = ?', [id, uid]);
    if (!a) echec(404, 'Analyse introuvable.');
    const recos = await db.all('SELECT * FROM recommandation WHERE analyse_id = ? ORDER BY id', [a.id]);
    const rang = toutes.findIndex((x) => x.id === a.id);
    const precedente = toutes[rang + 1] || null;
    return {
      id: a.id,
      date: iso(a.cree_le),
      poste: a.poste_vise,
      documents: a.lettre_id ? 'CV + lettre' : 'CV',
      version: toutes[rang].version,
      score: Number(a.score),
      scorePrecedent: precedente ? precedente.score : null,
      verdict: a.verdict,
      note: a.note_utilite ? Number(a.note_utilite) : null,
      pointsForts: JSON.parse(a.points_forts),
      aCorriger: JSON.parse(a.a_corriger),
      recommandations: recos.map((x) => ({
        id: x.id,
        priorite: PRIORITE[x.priorite],
        section: x.section,
        titre: x.titre,
        detail: x.detail,
        corrigee: !!x.corrigee_le,
        signalee: bool(x.signalee),
      })),
      versions: toutes.slice(rang, rang + 4).reverse().map((v) => ({ id: v.id, label: `v${v.version}`, date: v.date, score: v.score })),
    };
  });

  routeur.post('/api/candidat/analyses', candidat, async (r) => {
    const u = r.utilisateur;
    const poste = texte(r.corps.poste, 150);
    if (!poste) echec(400, 'Indiquez le poste visé.', { poste: 'Indiquez le poste visé.' });
    if (!r.corps.consentement) echec(400, 'Votre accord est nécessaire pour analyser vos documents.');

    const lire = (f, label) => {
      if (!f) return null;
      const nom = texte(f.nom, 200).replace(/[\\/]/g, '_');
      const buf = Buffer.from(String(f.contenu || ''), 'base64');
      if (!buf.length) echec(400, `${label} : fichier vide.`);
      if (buf.length > MAX_FICHIER) echec(400, `${label} : la taille maximale est de 5 Mo.`);
      const type = typeReel(buf);
      if (!type) echec(400, `${label} : format non accepté, déposez un PDF ou un DOCX.`);
      return { nom: nom || `document.${type}`, buf, type, texte: extraireTexte(buf, `x.${type}`) };
    };
    const cv = lire(r.corps.cv, 'CV');
    if (!cv) echec(400, 'Ajoutez au moins votre CV.');
    const lettre = lire(r.corps.lettre, 'Lettre');
    const resultat = analyser({ cv: cv.texte, lettre: lettre?.texte || '', poste });
    const partage = r.corps.partage ? 1 : 0;

    const id = await db.tx(async (t) => {
      const ajouter = async (d, type) =>
        (await t.run(
          'INSERT INTO document (utilisateur_id, type, nom_fichier, mime, taille, fichier, texte, partage, depose_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, type, d.nom, MIME[d.type], d.buf.length, d.buf, d.texte, partage, maintenant()],
        )).insertId;
      const cvId = await ajouter(cv, 'cv');
      const lettreId = lettre ? await ajouter(lettre, 'lettre') : null;
      const { insertId } = await t.run(
        'INSERT INTO analyse (utilisateur_id, cv_id, lettre_id, poste_vise, score, verdict, points_forts, a_corriger, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, cvId, lettreId, poste, resultat.score, resultat.verdict, JSON.stringify(resultat.pointsForts), JSON.stringify(resultat.aCorriger), maintenant()],
      );
      for (const x of resultat.recommandations) {
        await t.run('INSERT INTO recommandation (analyse_id, priorite, section, titre, detail) VALUES (?, ?, ?, ?, ?)', [insertId, x.priorite, x.section, x.titre, x.detail]);
      }
      await t.run('UPDATE utilisateur SET poste_vise = ?, consentement_analyse_le = COALESCE(consentement_analyse_le, ?), modifie_le = ? WHERE id = ?', [poste, maintenant(), maintenant(), u.id]);
      return insertId;
    });
    return { id, score: resultat.score };
  });

  routeur.patch('/api/candidat/recommandations/:id', candidat, async (r) => {
    const reco = await db.get(
      'SELECT x.id FROM recommandation x JOIN analyse a ON a.id = x.analyse_id WHERE x.id = ? AND a.utilisateur_id = ?',
      [Number(r.params.id), r.utilisateur.id],
    );
    if (!reco) echec(404, 'Recommandation introuvable.');
    if ('corrigee' in r.corps) await db.run('UPDATE recommandation SET corrigee_le = ? WHERE id = ?', [r.corps.corrigee ? maintenant() : null, reco.id]);
    if ('signalee' in r.corps) {
      await db.run('UPDATE recommandation SET signalee = ? WHERE id = ?', [r.corps.signalee ? 1 : 0, reco.id]);
      if (r.corps.signalee) await ctx.journal(r.utilisateur.id, 'recommandation.signalee', `Recommandation n° ${reco.id}`);
    }
    return { ok: true };
  });

  routeur.post('/api/candidat/analyses/:id/note', candidat, async (r) => {
    const note = Number(r.corps.note);
    if (!(note >= 1 && note <= 5)) echec(400, 'Note entre 1 et 5.');
    const { changes } = await db.run('UPDATE analyse SET note_utilite = ? WHERE id = ? AND utilisateur_id = ?', [Math.round(note), Number(r.params.id), r.utilisateur.id]);
    if (!changes) echec(404, 'Analyse introuvable.');
    return { ok: true };
  });

  // ---------- Modèles (candidats, conseillers et administrateurs) ----------
  routeur.get('/api/modeles', connecte, async () => {
    const rows = await db.all('SELECT id, type, nom, secteur, style FROM modele WHERE publie = 1 ORDER BY type, id');
    const secteurs = ['Tous', ...new Set(rows.map((m) => m.secteur).filter((s) => s !== 'Tous secteurs'))];
    return { modeles: rows, secteurs };
  });

  const remplirModele = (contenu, u) =>
    contenu
      .replaceAll('{{nom}}', u.nom_complet)
      .replaceAll('{{email}}', u.email)
      .replaceAll('{{telephone}}', u.telephone || 'Votre téléphone')
      .replaceAll('{{poste}}', u.poste_vise || 'Poste visé');

  routeur.get('/api/modeles/:id', connecte, async (r) => {
    const m = await db.get('SELECT * FROM modele WHERE id = ? AND publie = 1', [Number(r.params.id)]);
    if (!m) echec(404, 'Modèle introuvable.');
    await db.run("INSERT INTO utilisation_modele (modele_id, utilisateur_id, action, cree_le) VALUES (?, ?, 'apercu', ?)", [m.id, r.utilisateur.id, maintenant()]);
    return { id: m.id, nom: m.nom, type: m.type, secteur: m.secteur, style: m.style, contenu: remplirModele(m.contenu, r.utilisateur) };
  });

  routeur.get('/api/modeles/:id/telecharger', connecte, async (r) => {
    const m = await db.get('SELECT * FROM modele WHERE id = ? AND publie = 1', [Number(r.params.id)]);
    if (!m) echec(404, 'Modèle introuvable.');
    await db.run("INSERT INTO utilisation_modele (modele_id, utilisateur_id, action, cree_le) VALUES (?, ?, 'telecharge', ?)", [m.id, r.utilisateur.id, maintenant()]);
    const echap = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const corps = remplirModele(m.contenu, r.utilisateur)
      .split('\n')
      .map((l) => (l.startsWith('# ') ? `<h2>${echap(l.slice(2))}</h2>` : l.startsWith('- ') ? `<p>• ${echap(l.slice(2))}</p>` : l ? `<p>${echap(l)}</p>` : '<p>&nbsp;</p>'))
      .join('\n');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${echap(m.nom)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#0a1550}h2{color:#1a4bff;font-size:13pt;border-bottom:1px solid #e1e6f2;margin:14pt 0 4pt}p{margin:2pt 0}</style></head><body>${corps}</body></html>`;
    const fichier = `${m.nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_')}.doc`;
    r.res.writeHead(200, {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fichier}"`,
      'Cache-Control': 'no-store',
    });
    r.res.end(`﻿${html}`);
  });

  // ---------- Entretiens ----------
  routeur.get('/api/entretiens', connecte, async () => {
    const themes = await db.all('SELECT * FROM theme_entretien ORDER BY ordre, id');
    const questions = await db.all('SELECT * FROM question_entretien ORDER BY ordre, id');
    return themes.map((t) => ({
      id: t.code,
      themeId: t.id,
      label: t.label,
      intro: t.intro,
      questions: questions.filter((q) => q.theme_id === t.id).map((q) => ({ id: q.id, q: q.question, attendu: q.attendu, conseil: q.conseil })),
    }));
  });

  // ---------- Formation ----------
  async function quizCourant(uid) {
    const modules = await modulesDe(uid);
    const courant = modules.find((m) => m.etat === 'en-cours') || modules.find((m) => m.etat === 'a-venir');
    if (!courant) return { modules, quiz: null, termine: true };
    const q = await db.get('SELECT * FROM question_quiz WHERE module_id = ? AND ordre = ?', [courant.id, courant.question]);
    return {
      modules,
      termine: false,
      quiz: q && { moduleId: courant.id, n: courant.n, titre: courant.titre, question: courant.question, total: courant.total, intitule: q.question, options: JSON.parse(q.choix) },
    };
  }

  routeur.get('/api/candidat/formation', candidat, (r) => quizCourant(r.utilisateur.id));

  routeur.post('/api/candidat/formation/repondre', candidat, async (r) => {
    const uid = r.utilisateur.id;
    const { quiz } = await quizCourant(uid);
    if (!quiz || Number(r.corps.moduleId) !== quiz.moduleId) echec(409, 'Ce quiz a changé, rechargez la page.');
    const choix = Number(r.corps.choix);
    const q = await db.get('SELECT * FROM question_quiz WHERE module_id = ? AND ordre = ?', [quiz.moduleId, quiz.question]);
    const juste = choix === Number(q.bonne);
    let p = await db.get('SELECT * FROM progression_module WHERE utilisateur_id = ? AND module_id = ?', [uid, quiz.moduleId]);
    if (!p) {
      await db.run("INSERT INTO progression_module (utilisateur_id, module_id, statut, question_courante, bonnes_reponses) VALUES (?, ?, 'en_cours', 1, 0)", [uid, quiz.moduleId]);
      p = { question_courante: 1, bonnes_reponses: 0 };
    }
    const bonnes = Number(p.bonnes_reponses) + (juste ? 1 : 0);
    const suivante = Number(p.question_courante) + 1;
    let fin = null;
    if (suivante > quiz.total) {
      const seuil = Math.ceil(quiz.total * 2 / 3);
      if (bonnes >= seuil) {
        await db.run("UPDATE progression_module SET statut = 'valide', question_courante = ?, bonnes_reponses = ?, valide_le = ? WHERE utilisateur_id = ? AND module_id = ?", [suivante, bonnes, maintenant(), uid, quiz.moduleId]);
        fin = { valide: true, bonnes, total: quiz.total };
      } else {
        await db.run('UPDATE progression_module SET question_courante = 1, bonnes_reponses = 0 WHERE utilisateur_id = ? AND module_id = ?', [uid, quiz.moduleId]);
        fin = { valide: false, bonnes, total: quiz.total, seuil };
      }
    } else {
      await db.run('UPDATE progression_module SET question_courante = ?, bonnes_reponses = ? WHERE utilisateur_id = ? AND module_id = ?', [suivante, bonnes, uid, quiz.moduleId]);
    }
    return { juste, bonne: Number(q.bonne), explication: juste ? q.explication_bonne : q.explication_fausse, fin };
  });

  // ---------- Accompagnement ----------
  async function messagesDe(demandeId, moi) {
    const rows = await db.all('SELECT m.*, u.nom_complet FROM message m JOIN utilisateur u ON u.id = m.auteur_id WHERE m.demande_id = ? ORDER BY m.cree_le, m.id', [demandeId]);
    return rows.map((m) => ({ id: m.id, de: m.auteur_id === moi ? 'moi' : 'autre', auteur: m.nom_complet, texte: m.texte, date: iso(m.cree_le) }));
  }

  routeur.get('/api/candidat/accompagnement', candidat, async (r) => {
    const uid = r.utilisateur.id;
    const d = await derniereDemande(uid);
    const documents = await db.all('SELECT id, nom_fichier, partage FROM document WHERE utilisateur_id = ? ORDER BY depose_le DESC LIMIT 6', [uid]);
    const docs = documents.map((x) => ({ id: x.id, nom: x.nom_fichier, partage: bool(x.partage) }));
    if (!d) return { demande: null, documents: docs };
    await db.run('UPDATE message SET lu_le = ? WHERE demande_id = ? AND auteur_id <> ? AND lu_le IS NULL', [maintenant(), d.id, uid]);
    return {
      demande: {
        id: d.id,
        statut: STATUT[d.statut],
        envoyee: iso(d.cree_le),
        objectif: d.objectif,
        situation: d.situation,
        disponibilites: d.disponibilites,
        conseiller: conseillerPublic(d),
        etapes: etapesDemande(d, d.conseiller_nom),
      },
      messages: await messagesDe(d.id, uid),
      documents: docs,
    };
  });

  routeur.post('/api/candidat/accompagnement', candidat, async (r) => {
    const uid = r.utilisateur.id;
    const objectif = texte(r.corps.objectif, 300);
    if (!objectif) echec(400, 'Vérifiez le formulaire.', { objectif: 'Décrivez votre objectif.' });
    const ouverte = await db.get("SELECT id FROM demande_accompagnement WHERE candidat_id = ? AND statut <> 'cloturee'", [uid]);
    if (ouverte) echec(409, 'Vous avez déjà une demande en cours.');
    const { insertId } = await db.run(
      'INSERT INTO demande_accompagnement (candidat_id, statut, objectif, situation, disponibilites, cree_le, modifie_le) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uid, 'recue', objectif, texte(r.corps.situation, 300) || null, texte(r.corps.disponibilites, 150) || null, maintenant(), maintenant()],
    );
    return { id: insertId };
  });

  // Messages : le candidat de la demande ou son conseiller.
  async function demandeAccessible(r) {
    const d = await db.get('SELECT * FROM demande_accompagnement WHERE id = ?', [Number(r.params.id)]);
    const u = r.utilisateur;
    if (!d || (u.id !== d.candidat_id && u.id !== d.conseiller_id)) echec(404, 'Demande introuvable.');
    return d;
  }

  routeur.get('/api/demandes/:id/messages', connecte, async (r) => {
    const d = await demandeAccessible(r);
    await db.run('UPDATE message SET lu_le = ? WHERE demande_id = ? AND auteur_id <> ? AND lu_le IS NULL', [maintenant(), d.id, r.utilisateur.id]);
    return messagesDe(d.id, r.utilisateur.id);
  });

  routeur.post('/api/demandes/:id/messages', connecte, async (r) => {
    const d = await demandeAccessible(r);
    const t = texte(r.corps.texte, 2000);
    if (!t) echec(400, 'Message vide.');
    if (d.statut === 'cloturee') echec(409, 'Cette demande est clôturée.');
    if (d.statut === 'recue') echec(409, 'Un conseiller doit d’abord être assigné à votre demande.');
    await db.run('INSERT INTO message (demande_id, auteur_id, texte, cree_le) VALUES (?, ?, ?, ?)', [d.id, r.utilisateur.id, t, maintenant()]);
    // Le conseiller qui répond à une demande assignée la passe « en cours ».
    if (r.utilisateur.id === d.conseiller_id && d.statut === 'assignee') {
      await db.run("UPDATE demande_accompagnement SET statut = 'en_cours', en_cours_le = ?, modifie_le = ? WHERE id = ?", [maintenant(), maintenant(), d.id]);
    }
    return messagesDe(d.id, r.utilisateur.id);
  });

  // ---------- Documents ----------
  routeur.get('/api/documents/:id/fichier', connecte, async (r) => {
    const doc = await db.get('SELECT * FROM document WHERE id = ?', [Number(r.params.id)]);
    const u = r.utilisateur;
    let autorise = doc && doc.utilisateur_id === u.id;
    if (doc && !autorise && u.role === 'conseiller' && bool(doc.partage)) {
      autorise = !!(await db.get('SELECT id FROM demande_accompagnement WHERE candidat_id = ? AND conseiller_id = ?', [doc.utilisateur_id, u.id]));
    }
    if (!autorise) echec(404, 'Document introuvable.');
    if (!doc.fichier) echec(404, 'Ce document de démonstration n’a pas de fichier joint.');
    const contenu = Buffer.from(doc.fichier);
    r.res.writeHead(200, {
      'Content-Type': doc.mime || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.nom_fichier)}"`,
      'Content-Length': contenu.length,
      'Cache-Control': 'private, no-store',
    });
    r.res.end(contenu);
  });

  routeur.patch('/api/documents/:id', candidat, async (r) => {
    const { changes } = await db.run('UPDATE document SET partage = ? WHERE id = ? AND utilisateur_id = ?', [r.corps.partage ? 1 : 0, Number(r.params.id), r.utilisateur.id]);
    if (!changes) echec(404, 'Document introuvable.');
    return { ok: true };
  });

  routeur.delete('/api/documents/:id', candidat, async (r) => {
    const id = Number(r.params.id);
    const doc = await db.get('SELECT id, nom_fichier FROM document WHERE id = ? AND utilisateur_id = ?', [id, r.utilisateur.id]);
    if (!doc) echec(404, 'Document introuvable.');
    // Le fichier et ses analyses sont effacés.
    await db.tx(async (t) => {
      await t.run('DELETE FROM analyse WHERE utilisateur_id = ? AND (cv_id = ? OR lettre_id = ?)', [r.utilisateur.id, id, id]);
      await t.run('DELETE FROM document WHERE id = ?', [id]);
    });
    await ctx.journal(r.utilisateur.id, 'document.supprime', doc.nom_fichier);
    return { ok: true };
  });

  // ---------- Profil ----------
  routeur.get('/api/candidat/profil', candidat, async (r) => {
    const u = r.utilisateur;
    const docs = await db.all('SELECT id, type, nom_fichier, taille, partage, depose_le FROM document WHERE utilisateur_id = ? ORDER BY depose_le DESC', [u.id]);
    return {
      candidat: { ...publicUtilisateur(u), consentementAnalyse: iso(u.consentement_analyse_le) },
      documents: docs.map((d) => ({ id: d.id, nom: d.nom_fichier, type: d.type, date: iso(d.depose_le), partage: bool(d.partage), taille: Number(d.taille) })),
    };
  });

  routeur.patch('/api/candidat/profil', candidat, async (r) => {
    const u = r.utilisateur;
    const c = r.corps;
    const nom = texte(c.nom ?? u.nom_complet, 120);
    const email = texte(c.email ?? u.email, 255).toLowerCase();
    const champs = {};
    if (!nom) champs.nom = 'Indiquez votre nom.';
    if (!emailValide(email)) champs.email = 'Adresse e-mail invalide.';
    if (!champs.email && email !== u.email && (await db.get('SELECT id FROM utilisateur WHERE email = ?', [email]))) champs.email = 'Cette adresse est déjà utilisée.';
    if (Object.keys(champs).length) echec(400, 'Vérifiez le formulaire.', champs);
    const consent = 'consentement' in c ? (c.consentement ? u.consentement_analyse_le || maintenant() : null) : u.consentement_analyse_le;
    await db.run(
      'UPDATE utilisateur SET nom_complet = ?, email = ?, telephone = ?, secteur = ?, poste_vise = ?, langue = ?, consentement_analyse_le = ?, modifie_le = ? WHERE id = ?',
      [nom, email, texte(c.telephone ?? u.telephone, 30) || null, texte(c.secteur ?? u.secteur, 120) || null, texte(c.posteVise ?? u.poste_vise, 150) || null,
        c.langue === 'en' ? 'en' : c.langue === 'fr' ? 'fr' : u.langue, consent, maintenant(), u.id],
    );
    return publicUtilisateur(await db.get('SELECT * FROM utilisateur WHERE id = ?', [u.id]));
  });

  routeur.get('/api/candidat/export', candidat, async (r) => {
    const u = r.utilisateur;
    const donnees = {
      exporte_le: new Date().toISOString(),
      compte: publicUtilisateur(u),
      documents: await db.all('SELECT id, type, nom_fichier, taille, partage, depose_le FROM document WHERE utilisateur_id = ?', [u.id]),
      analyses: await db.all('SELECT id, poste_vise, score, verdict, points_forts, a_corriger, cree_le FROM analyse WHERE utilisateur_id = ?', [u.id]),
      formation: await db.all('SELECT module_id, statut, valide_le FROM progression_module WHERE utilisateur_id = ?', [u.id]),
      demandes: await db.all('SELECT id, statut, objectif, situation, disponibilites, cree_le FROM demande_accompagnement WHERE candidat_id = ?', [u.id]),
      messages: await db.all('SELECT m.demande_id, m.texte, m.cree_le FROM message m JOIN demande_accompagnement d ON d.id = m.demande_id WHERE d.candidat_id = ?', [u.id]),
    };
    r.res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mes-donnees-caip.json"',
      'Cache-Control': 'no-store',
    });
    r.res.end(JSON.stringify(donnees, null, 2));
  });

  routeur.delete('/api/candidat/compte', candidat, async (r) => {
    const u = r.utilisateur;
    if (!(await verifierMotDePasse(String(r.corps.password || ''), u.mot_de_passe_hash))) {
      echec(400, 'Mot de passe incorrect.', { password: 'Mot de passe incorrect.' });
    }
    await ctx.journal(null, 'compte.supprime', `Compte candidat n° ${u.id} supprimé à sa demande`);
    await db.run('DELETE FROM utilisateur WHERE id = ?', [u.id]);
    r.res.setHeader('Set-Cookie', ctx.cookieSession('', 0));
    return { ok: true };
  });
}
