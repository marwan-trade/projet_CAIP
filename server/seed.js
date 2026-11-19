// Données de démonstration, ajoutées une seule fois sur une base vide.
// Mot de passe commun des comptes de démonstration : DEMO_PASSWORD (par défaut « Caip2026! »).
import { hacherMotDePasse } from './securite.js';
import { maintenant } from './db.js';

const JOUR = 86400000;
const il_y_a = (jours, heures = 0) => maintenant(-(jours * JOUR + heures * 3600000));

const CV_CLASSIQUE = `# {{nom}}
{{poste}}
{{email}} · {{telephone}}

# Profil
En deux ou trois lignes : qui vous êtes, ce que vous savez faire et le poste que vous visez.

# Expérience
Année – Année · Intitulé du poste · Entreprise, ville
- Verbe d'action + mission + résultat chiffré (ex. « Traité 120 factures par mois »)
- Verbe d'action + mission + résultat chiffré

# Formation
Année · Diplôme · Établissement

# Compétences
Logiciels : …
Savoir-faire : …

# Langues
Français : courant · Anglais : intermédiaire`;

const LETTRE = `{{nom}}
{{email}} · {{telephone}}

Objet : candidature au poste de {{poste}}

Madame, Monsieur,

Premier paragraphe : le poste visé et comment vous l'avez connu.

Deuxième paragraphe : deux exemples concrets de ce que vous avez déjà réalisé et qui servent ce poste.

Troisième paragraphe : pourquoi cette entreprise, et ce que vous lui apporterez.

Je me tiens à votre disposition pour un entretien et vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.

{{nom}}`;

const MODELES = [
  ['cv', 'CV Classique', 'Administration', 'classique'],
  ['cv', 'CV Moderne', 'Commerce', 'colonne'],
  ['cv', 'CV Premier emploi', 'Tous secteurs', 'classique'],
  ['cv', 'CV Reconversion', 'Tous secteurs', 'colonne'],
  ['cv', 'CV Technique', 'Informatique', 'classique'],
  ['cv', 'CV Santé', 'Santé', 'colonne'],
  ['cv', 'CV Compact', 'Commerce', 'classique'],
  ['cv', 'CV Bilingue', 'Administration', 'colonne'],
  ['lettre', 'Réponse à une offre', 'Tous secteurs', 'lettre'],
  ['lettre', 'Candidature spontanée', 'Commerce', 'lettre'],
  ['lettre', 'Premier emploi', 'Tous secteurs', 'lettre'],
  ['lettre', 'Reconversion', 'Tous secteurs', 'lettre'],
  ['lettre', 'Demande de stage', 'Administration', 'lettre'],
];

const THEMES = [
  ['frequentes', 'Questions fréquentes', 'Les questions posées dans presque tous les entretiens.', [
    ['Parlez-moi de vous.', 'Votre capacité à résumer votre parcours en lien avec le poste.', 'Deux à trois minutes : formation, expérience clé, ce qui vous amène ici.'],
    ['Pourquoi ce poste vous intéresse-t-il ?', 'Votre motivation et ce que vous savez de l’entreprise.', 'Citez un élément précis de l’offre ou de l’entreprise.'],
    ['Quelles sont vos qualités et vos défauts ?', 'Votre lucidité sur vous-même.', 'Pour un défaut, montrez ce que vous faites pour progresser.'],
    ['Où vous voyez-vous dans cinq ans ?', 'Si votre projet est cohérent avec le poste.', 'Restez réaliste et liez votre réponse au poste proposé.'],
  ]],
  ['parcours', 'Présenter son parcours', 'Raconter son parcours de façon claire et convaincante.', [
    ['Comment expliquer un trou dans mon CV ?', 'Votre honnêteté et ce que vous avez fait de cette période.', 'Restez bref et montrez ce que vous avez appris.'],
    ['Comment valoriser un premier emploi ?', 'Vos stages, projets et engagements.', 'Appuyez-vous sur des exemples concrets et chiffrés.'],
  ]],
  ['comportement', 'Comportement', 'Attitude, tenue et communication non verbale.', [
    ['Comment gérer le stress le jour J ?', 'Votre capacité à rester posé.', 'Arrivez 10 minutes en avance et préparez trois exemples.'],
    ['Que faire si je ne connais pas la réponse ?', 'Votre honnêteté et votre réflexion.', 'Dites-le simplement et expliquez comment vous chercheriez.'],
  ]],
  ['questions', 'Questions à poser', 'Montrer son intérêt en fin d’entretien.', [
    ['Quelles questions poser au recruteur ?', 'Votre intérêt réel pour le poste.', 'Demandez à quoi ressemble une journée type ou les objectifs des premiers mois.'],
  ]],
  ['erreurs', 'Erreurs courantes', 'Ce qu’il vaut mieux éviter.', [
    ['Les erreurs les plus fréquentes', 'Votre préparation.', 'Ne pas connaître l’entreprise, critiquer un ancien employeur, arriver en retard.'],
  ]],
];

// Trois questions par module : [question, choix, index de la bonne, explication].
const MODULES = [
  ['Construire son projet professionnel', [
    ['Par quoi commencer un projet professionnel ?', ['Envoyer beaucoup de CV', 'Faire le point sur ses compétences et envies', 'Choisir le salaire le plus élevé', 'Copier le projet d’un ami'], 1, 'Un projet solide part de ce que vous savez faire et de ce que vous voulez faire.'],
    ['Une enquête métier, c’est…', ['Un test de personnalité', 'Échanger avec une personne qui exerce le métier', 'Un concours', 'Un entretien d’embauche'], 1, 'Parler à quelqu’un du métier est le meilleur moyen de vérifier qu’il vous convient.'],
    ['Un objectif professionnel doit être…', ['Vague pour garder des options', 'Précis et réaliste', 'Le même que celui de vos parents', 'Secret'], 1, 'Un objectif précis et réaliste guide toutes vos candidatures.'],
  ]],
  ['Rédiger un CV efficace', [
    ['Combien de pages pour un premier emploi ?', ['Une page', 'Deux pages', 'Trois pages', 'Peu importe'], 0, 'Une page suffit : le recruteur lit vite.'],
    ['Comment décrire une expérience ?', ['Avec des adjectifs', 'Avec un verbe d’action et un résultat', 'En recopiant la fiche de poste', 'En une seule phrase longue'], 1, 'Verbe d’action + mission + résultat chiffré : c’est ce que retient le recruteur.'],
    ['Que mettre en haut du CV ?', ['Vos loisirs', 'Le poste visé', 'Votre date de naissance', 'Une citation'], 1, 'Le titre du poste visé montre tout de suite ce que vous cherchez.'],
  ]],
  ['Se présenter en entretien', [
    ["Combien de temps viser pour vous présenter au début d'un entretien ?", ['30 secondes', '2 à 3 minutes', '10 minutes', 'Autant que nécessaire'], 1, 'Deux à trois minutes suffisent : votre parcours, vos atouts pour le poste et ce qui vous motive.'],
    ['Que faire avant l’entretien ?', ['Rien, pour rester naturel', 'Se renseigner sur l’entreprise', 'Apprendre son CV par cœur', 'Arriver au dernier moment'], 1, 'Connaître l’entreprise montre votre motivation.'],
    ['Quelle tenue choisir ?', ['La plus confortable', 'Une tenue adaptée à l’entreprise', 'La plus originale', 'Une tenue de sport'], 1, 'Adaptez votre tenue au milieu professionnel visé.'],
  ]],
  ['Répondre aux questions difficiles', [
    ['On vous demande votre principal défaut. Vous…', ['Dites que vous n’en avez pas', 'Citez un vrai défaut et ce que vous faites pour progresser', 'Changez de sujet', 'Citez une qualité déguisée'], 1, 'L’honnêteté et la volonté de progresser rassurent le recruteur.'],
    ['Vous ne connaissez pas une réponse. Vous…', ['Inventez', 'Le dites et expliquez comment vous chercheriez', 'Restez silencieux', 'Posez une autre question'], 1, 'Reconnaître une limite avec méthode est une qualité.'],
    ['Comment parler d’un ancien employeur ?', ['En le critiquant', 'Avec respect, en restant factuel', 'En évitant toute mention', 'Avec humour'], 1, 'Critiquer un ancien employeur inquiète toujours le recruteur.'],
  ]],
  ['Négocier et conclure', [
    ['Quand parler du salaire ?', ['Dès la première minute', 'Quand le recruteur aborde le sujet', 'Jamais', 'Par e-mail avant l’entretien'], 1, 'Laissez le recruteur ouvrir le sujet, et préparez une fourchette.'],
    ['Comment préparer sa fourchette de salaire ?', ['Au hasard', 'En s’informant sur les salaires du poste', 'En demandant le double', 'En prenant le minimum'], 1, 'Une fourchette réaliste se prépare à partir des salaires du marché.'],
    ['Pour conclure l’entretien, vous…', ['Partez rapidement', 'Remerciez et demandez la suite du processus', 'Demandez la réponse immédiatement', 'Parlez de vos vacances'], 1, 'Remercier et demander les prochaines étapes laisse une bonne impression.'],
  ]],
  ["Après l'entretien", [
    ['Que faire le lendemain de l’entretien ?', ['Rien', 'Envoyer un court message de remerciement', 'Appeler toutes les heures', 'Envoyer un nouveau CV'], 1, 'Un message de remerciement montre votre intérêt.'],
    ['Sans réponse après le délai annoncé, vous…', ['Abandonnez', 'Relancez poliment', 'Écrivez au directeur', 'Postulez à nouveau'], 1, 'Une relance polie est normale et appréciée.'],
    ['Après un refus, le mieux est de…', ['Demander un retour pour progresser', 'Se décourager', 'Répondre sèchement', 'Ne plus postuler'], 0, 'Un retour du recruteur vous aide à réussir le prochain entretien.'],
  ]],
];

export async function remplir(db) {
  const mdp = await hacherMotDePasse(process.env.DEMO_PASSWORD || 'Caip2026!');
  const user = async (nom, email, role, extra = {}, joursAvant = 30) => {
    const r = await db.run(
      `INSERT INTO utilisateur (nom_complet, email, mot_de_passe_hash, role, telephone, secteur, poste_vise, specialite, cgu_acceptees_le, consentement_analyse_le, cree_le, modifie_le)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, email, mdp, role, extra.telephone ?? null, extra.secteur ?? null, extra.poste ?? null, extra.specialite ?? null,
        il_y_a(joursAvant), role === 'candidat' ? il_y_a(joursAvant) : null, il_y_a(joursAvant), il_y_a(joursAvant)],
    );
    return r.insertId;
  };

  const admin = await user('Administration CAIP', 'admin@caip.dj', 'administrateur', {}, 60);
  const ali = await user('M. Ali', 'ali@caip.dj', 'conseiller', { specialite: 'Premier emploi' }, 60);
  const deka = await user('Mme Deka', 'deka@caip.dj', 'conseiller', { specialite: 'Reconversion' }, 60);
  const amina = await user('Amina Hassan', 'amina@exemple.com', 'candidat', { telephone: '+253 77 00 00 00', secteur: 'Comptabilité', poste: 'Assistante comptable' }, 12);
  const hassan = await user('Hassan Omar', 'hassan@exemple.com', 'candidat', { secteur: 'Logistique', poste: 'Agent logistique' }, 14);
  const fatouma = await user('Fatouma Ali', 'fatouma@exemple.com', 'candidat', { secteur: 'Commerce', poste: 'Responsable de magasin' }, 11);
  const ibrahim = await user('Ibrahim Moussa', 'ibrahim@exemple.com', 'candidat', { secteur: 'Maintenance', poste: 'Technicien de maintenance' }, 9);
  const safia = await user('Safia Ahmed', 'safia@exemple.com', 'candidat', { secteur: 'Administration', poste: 'Assistante administrative' }, 25);
  const nasra = await user('Nasra Djama', 'nasra@exemple.com', 'candidat', { secteur: 'Santé', poste: 'Aide-soignante' }, 1);
  const abdi = await user('Abdi Youssouf', 'abdi@exemple.com', 'candidat', { secteur: 'Informatique', poste: 'Technicien support' }, 2);

  for (let i = 1; i <= 4; i++) {
    await db.run('INSERT INTO centre_partenaire (nom, ordre) VALUES (?, ?)', [`[Partenaire ${i}]`, i]);
  }

  for (const [type, nom, secteur, style] of MODELES) {
    await db.run('INSERT INTO modele (type, nom, secteur, style, contenu) VALUES (?, ?, ?, ?, ?)', [type, nom, secteur, style, type === 'cv' ? CV_CLASSIQUE : LETTRE]);
  }

  for (const [i, [code, label, intro, questions]] of THEMES.entries()) {
    const { insertId } = await db.run('INSERT INTO theme_entretien (code, label, intro, ordre) VALUES (?, ?, ?, ?)', [code, label, intro, i + 1]);
    for (const [j, [q, a, c]] of questions.entries()) {
      await db.run('INSERT INTO question_entretien (theme_id, question, attendu, conseil, ordre) VALUES (?, ?, ?, ?, ?)', [insertId, q, a, c, j + 1]);
    }
  }

  const moduleIds = [];
  for (const [i, [titre, questions]] of MODULES.entries()) {
    const { insertId } = await db.run('INSERT INTO module_formation (numero, titre) VALUES (?, ?)', [i + 1, titre]);
    moduleIds.push(insertId);
    for (const [j, [q, choix, bonne, expl]] of questions.entries()) {
      await db.run(
        'INSERT INTO question_quiz (module_id, ordre, question, choix, bonne, explication_bonne, explication_fausse) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [insertId, j + 1, q, JSON.stringify(choix), bonne, expl, `La bonne réponse était « ${choix[bonne]} ». ${expl}`],
      );
    }
  }
  // Amina : modules 1 et 2 validés, module 3 en cours (question 2).
  await db.run("INSERT INTO progression_module (utilisateur_id, module_id, statut, question_courante, bonnes_reponses, valide_le) VALUES (?, ?, 'valide', 4, 3, ?)", [amina, moduleIds[0], il_y_a(10)]);
  await db.run("INSERT INTO progression_module (utilisateur_id, module_id, statut, question_courante, bonnes_reponses, valide_le) VALUES (?, ?, 'valide', 4, 3, ?)", [amina, moduleIds[1], il_y_a(8)]);
  await db.run("INSERT INTO progression_module (utilisateur_id, module_id, statut, question_courante, bonnes_reponses) VALUES (?, ?, 'en_cours', 2, 1)", [amina, moduleIds[2]]);

  // Documents et analyses
  const doc = async (u, type, nom, jours, partage = 0) =>
    (await db.run('INSERT INTO document (utilisateur_id, type, nom_fichier, mime, taille, partage, depose_le) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u, type, nom, nom.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 180000, partage, il_y_a(jours)])).insertId;

  const analyseDemo = async (u, cv, lettre, poste, score, verdict, forts, faibles, recos, jours) => {
    const { insertId } = await db.run(
      'INSERT INTO analyse (utilisateur_id, cv_id, lettre_id, poste_vise, score, verdict, points_forts, a_corriger, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [u, cv, lettre, poste, score, verdict, JSON.stringify(forts), JSON.stringify(faibles), il_y_a(jours)],
    );
    for (const [priorite, section, titre, detail] of recos) {
      await db.run('INSERT INTO recommandation (analyse_id, priorite, section, titre, detail) VALUES (?, ?, ?, ?, ?)', [insertId, priorite, section, titre, detail]);
    }
    return insertId;
  };

  const cv1 = await doc(amina, 'cv', 'CV_Amina_v1.pdf', 11);
  const cv2 = await doc(amina, 'cv', 'CV_Amina_Hassan.pdf', 7, 1);
  const l1 = await doc(amina, 'lettre', 'Lettre_comptable.docx', 7);
  await analyseDemo(amina, cv1, null, 'Assistante comptable', 52, 'Bonne base, à affiner',
    ['Formation clairement présentée, avec diplôme et année.', 'Langues indiquées avec le niveau.'],
    ['Expériences décrites sans résultats concrets.', 'Aucun titre de poste en haut du CV.', 'Compétences techniques trop générales.'],
    [['haute', 'Expérience', 'Chiffrez vos réalisations', 'Remplacez « suivi des factures » par un résultat mesurable.'],
      ['haute', 'Profil', 'Ajoutez un titre adapté au poste', 'Placez « Assistante comptable » en haut du CV.']], 11);
  await analyseDemo(amina, cv2, l1, 'Assistante comptable', 64, 'Bonne base, à affiner',
    ['Formation clairement présentée, avec diplôme et année.', 'Stage en cabinet comptable cohérent avec le poste visé.', 'Rubriques dans un ordre logique et facile à lire.', 'Langues indiquées avec le niveau.'],
    ['Expériences décrites sans résultats concrets.', 'Aucun titre de poste en haut du CV.', 'Compétences techniques trop générales.', 'CV sur deux pages pour un premier emploi.'],
    [['haute', 'Expérience', 'Chiffrez vos réalisations', 'Remplacez « suivi des factures » par un résultat mesurable, par exemple le nombre de factures traitées par mois.'],
      ['haute', 'Profil', 'Ajoutez un titre adapté au poste', 'Placez « Assistante comptable » en haut du CV pour que le recruteur voie tout de suite le poste visé.'],
      ['haute', 'Compétences', 'Citez vos logiciels de comptabilité', 'Le poste demande la maîtrise d’outils comptables : indiquez ceux que vous connaissez et votre niveau.'],
      ['moyenne', 'Mise en page', 'Réduisez à une seule page', 'Pour un premier emploi, une page suffit. Regroupez les formations secondaires.'],
      ['basse', 'Coordonnées', 'Utilisez une adresse e-mail professionnelle', 'Préférez une adresse de la forme prenom.nom@…']], 7);

  const cvH = await doc(hassan, 'cv', 'CV_Hassan_Omar.pdf', 12, 1);
  await analyseDemo(hassan, cvH, null, 'Agent logistique', 58, 'Bonne base, à affiner', ['Expérience longue et stable.'], ['Compétences logistiques peu détaillées.'],
    [['haute', 'Compétences', 'Mettez en avant vos compétences transférables', 'Gestion de stock, relation client, organisation : reliez-les à la logistique.']], 12);
  const cvI = await doc(ibrahim, 'cv', 'CV_Ibrahim.pdf', 8, 1);
  await analyseDemo(ibrahim, cvI, null, 'Technicien de maintenance', 71, 'Bonne candidature, quelques détails', ['Outils et habilitations cités.'], ['Peu de résultats chiffrés.'],
    [['moyenne', 'Expérience', 'Chiffrez vos interventions', 'Indiquez le nombre d’équipements suivis ou le temps d’arrêt évité.']], 8);

  // Demandes d'accompagnement et messages
  const demande = async (c, cons, statut, objectif, situation, dispo, jours, extra = {}) =>
    (await db.run(
      `INSERT INTO demande_accompagnement (candidat_id, conseiller_id, statut, objectif, situation, disponibilites, cree_le, assignee_le, en_cours_le, cloturee_le, modifie_le)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c, cons, statut, objectif, situation, dispo, il_y_a(jours), extra.assignee ?? (cons ? il_y_a(jours, -6) : null), extra.enCours ?? null, extra.cloturee ?? null, il_y_a(0)],
    )).insertId;

  const dAmina = await demande(amina, ali, 'en_cours', 'Obtenir un premier poste en comptabilité', 'Jeune diplômée en comptabilité', 'Matinées en semaine', 9, { enCours: il_y_a(8) });
  await demande(hassan, ali, 'assignee', 'Se reconvertir dans la logistique', '10 ans dans le commerce, en reconversion', 'Après-midi', 12, { assignee: il_y_a(4) });
  const dFat = await demande(fatouma, ali, 'en_cours', 'Évoluer vers un poste de responsable', 'En poste depuis 4 ans', 'Le soir', 10, { enCours: il_y_a(9) });
  await demande(ibrahim, ali, 'assignee', 'Préparer un entretien la semaine prochaine', 'Technicien, recherche active', 'Toute la journée', 1, { assignee: il_y_a(1) });
  await demande(safia, deka, 'cloturee', 'Relecture de lettre', 'Jeune diplômée', 'Matin', 22, { enCours: il_y_a(21), cloturee: il_y_a(13) });
  await demande(nasra, null, 'recue', 'Préparer un entretien', 'Diplômée aide-soignante', 'Matin', 0);
  await demande(abdi, null, 'recue', 'Relecture de CV', 'Technicien support en recherche', 'Après-midi', 1);

  const msg = async (d, auteur, texte, jours, heures) => db.run('INSERT INTO message (demande_id, auteur_id, texte, cree_le, lu_le) VALUES (?, ?, ?, ?, ?)', [d, auteur, texte, il_y_a(jours, heures), il_y_a(jours, heures - 1)]);
  await msg(dAmina, ali, "Bonjour Amina, j'ai lu votre CV. Votre stage est un vrai atout. Pouvons-nous en parler jeudi à 10 h ?", 8, 2);
  await msg(dAmina, amina, 'Oui, jeudi 10 h me convient. Merci beaucoup !', 8, 1);
  await msg(dAmina, ali, "Parfait. D'ici là, essayez de corriger les recommandations prioritaires du rapport.", 8, 0);
  await msg(dAmina, amina, 'J’ai corrigé le titre de mon CV. Pouvez-vous le relire ?', 1, 3);
  await msg(dFat, ali, 'Bonjour Fatouma, pouvez-vous me partager votre CV actuel ?', 9, 3);

  // Utilisations de modèles pour l'indicateur
  for (let i = 0; i < 6; i++) {
    await db.run("INSERT INTO utilisation_modele (modele_id, utilisateur_id, action, cree_le) VALUES (1, ?, 'apercu', ?)", [[amina, hassan, fatouma, ibrahim, safia, abdi][i], il_y_a(i + 1)]);
    if (i < 4) await db.run("INSERT INTO utilisation_modele (modele_id, utilisateur_id, action, cree_le) VALUES (1, ?, 'telecharge', ?)", [[amina, hassan, fatouma, ibrahim][i], il_y_a(i + 1)]);
  }

  await db.run('INSERT INTO journal_audit (utilisateur_id, action, detail, cree_le) VALUES (?, ?, ?, ?)', [admin, 'base.initialisee', 'Données de démonstration ajoutées', maintenant()]);
}
