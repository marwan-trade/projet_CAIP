// Analyse d'une candidature par règles simples et explicables.
// Chaque règle rapporte des points, et produit soit un point fort, soit un
// point à corriger avec une recommandation classée par priorité.

const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const SECTIONS = {
  experience: ['experience', 'experiences professionnelles', 'parcours professionnel', 'stage', 'stages', 'emploi'],
  formation: ['formation', 'diplome', 'diplomes', 'etudes', 'education', 'licence', 'master', 'baccalaureat', 'bts'],
  competences: ['competences', 'savoir-faire', 'aptitudes', 'skills'],
  langues: ['langues', 'francais', 'anglais', 'arabe', 'somali', 'afar'],
};

const VERBES = [
  'gere', 'organise', 'realise', 'developpe', 'encadre', 'pilote', 'coordonne', 'concu', 'mis en place',
  'ameliore', 'redige', 'analyse', 'negocie', 'forme', 'supervise', 'optimise', 'cree', 'suivi', 'traite',
  'accueilli', 'conseille', 'vendu', 'prepare', 'controle', 'assure', 'participe', 'contribue', 'lance',
];

const OUTILS = [
  'excel', 'word', 'powerpoint', 'outlook', 'office', 'sage', 'ciel', 'sap', 'odoo', 'quickbooks', 'erp',
  'python', 'java', 'javascript', 'sql', 'php', 'html', 'react', 'autocad', 'photoshop', 'canva',
  'google', 'crm', 'salesforce', 'linux', 'windows', 'git',
];

const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'en', 'et', 'a', 'au', 'aux', 'un', 'une', 'pour', 'chez', 'd', 'l']);

function contient(texte, mots) {
  return mots.some((m) => new RegExp(`(^|[^a-z])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm').test(texte));
}

export function analyser({ cv = '', lettre = '', poste = '' }) {
  const brut = cv || '';
  const t = sansAccents(brut);
  const mots = t.split(/\s+/).filter(Boolean);
  const nbMots = mots.length;
  const forts = [];
  const faibles = [];
  const recos = [];
  let points = 0;

  const regle = (ok, valeur, fort, faible, reco) => {
    if (ok) {
      points += valeur;
      if (fort) forts.push(fort);
    } else {
      if (faible) faibles.push(faible);
      if (reco) recos.push(reco);
    }
  };

  // Texte illisible (PDF scanné, fichier vide…)
  if (nbMots < 30) {
    return {
      score: 20,
      verdict: 'Texte du CV illisible',
      pointsForts: ['Votre CV a bien été reçu.'],
      aCorriger: ['Nous n’avons pas pu lire le texte de votre CV : il s’agit peut-être d’une image ou d’un scan.'],
      recommandations: [
        {
          priorite: 'haute',
          section: 'Format',
          titre: 'Déposez un CV au format texte',
          detail: 'Enregistrez votre CV depuis Word ou un éditeur de texte (DOCX ou PDF « texte »), pas une photo ni un scan, puis relancez l’analyse.',
        },
      ],
    };
  }

  // 1. Poste visé en titre
  const motsPoste = sansAccents(poste).split(/[^a-z0-9]+/).filter((m) => m.length > 2 && !MOTS_VIDES.has(m));
  const debut = t.slice(0, 400);
  const posteEnHaut = motsPoste.length > 0 && motsPoste.filter((m) => debut.includes(m)).length >= Math.ceil(motsPoste.length / 2);
  regle(
    posteEnHaut, 15,
    'Le poste visé apparaît en haut du CV.',
    'Aucun titre de poste en haut du CV.',
    { priorite: 'haute', section: 'Profil', titre: 'Ajoutez un titre adapté au poste', detail: `Placez « ${poste} » en haut du CV pour que le recruteur voie tout de suite le poste visé.` },
  );

  // 2. Coordonnées
  const email = brut.match(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i)?.[0] || '';
  const tel = /(\+?\d[\d .-]{7,}\d)/.test(brut);
  regle(
    email && tel, 10,
    'Coordonnées complètes (e-mail et téléphone).',
    !email ? 'Adresse e-mail absente du CV.' : 'Numéro de téléphone absent du CV.',
    { priorite: 'haute', section: 'Coordonnées', titre: !email ? 'Indiquez votre adresse e-mail' : 'Indiquez votre numéro de téléphone', detail: 'Le recruteur doit pouvoir vous joindre facilement : placez vos coordonnées en haut du CV.' },
  );
  if (email) {
    const local = email.split('@')[0];
    const pro = /[._-]/.test(local) && !/\d{3,}/.test(local);
    regle(
      pro, 3, null, null,
      { priorite: 'basse', section: 'Coordonnées', titre: 'Utilisez une adresse e-mail professionnelle', detail: 'Préférez une adresse de la forme prenom.nom@…, sans surnom ni longue suite de chiffres.' },
    );
  }

  // 3. Rubriques essentielles
  const manquantes = [];
  for (const [nom, cles] of Object.entries(SECTIONS)) {
    const ok = contient(t, cles);
    if (ok) points += nom === 'langues' ? 5 : 8;
    else manquantes.push(nom);
  }
  if (manquantes.length === 0) forts.push('Toutes les rubriques attendues sont présentes : expérience, formation, compétences, langues.');
  else {
    const libelles = { experience: 'Expérience', formation: 'Formation', competences: 'Compétences', langues: 'Langues' };
    faibles.push(`Rubrique${manquantes.length > 1 ? 's' : ''} absente${manquantes.length > 1 ? 's' : ''} : ${manquantes.map((m) => libelles[m]).join(', ')}.`);
    recos.push({
      priorite: manquantes.includes('experience') || manquantes.includes('formation') ? 'haute' : 'moyenne',
      section: 'Structure',
      titre: `Ajoutez la rubrique ${manquantes.map((m) => libelles[m]).join(' et ')}`,
      detail: 'Un recruteur parcourt un CV en quelques secondes : des rubriques claires l’aident à trouver l’essentiel.',
    });
  }

  // 4. Résultats chiffrés
  const chiffres = (brut.match(/\d+\s?(%|€|fdj|\$|k|clients?|factures?|personnes?|dossiers?|ventes?|projets?|heures?)/gi) || []).length;
  regle(
    chiffres >= 2, 14,
    'Des résultats concrets et chiffrés.',
    'Expériences décrites sans résultats concrets.',
    { priorite: 'haute', section: 'Expérience', titre: 'Chiffrez vos réalisations', detail: 'Remplacez une tâche par un résultat mesurable, par exemple « 120 factures traitées par mois » ou « ventes en hausse de 15 % ».' },
  );

  // 5. Verbes d'action
  const verbes = VERBES.filter((v) => t.includes(v)).length;
  regle(
    verbes >= 3, 8,
    'Des verbes d’action qui rendent vos missions vivantes.',
    'Missions décrites sans verbes d’action.',
    { priorite: 'moyenne', section: 'Expérience', titre: 'Commencez chaque mission par un verbe d’action', detail: 'Par exemple : « Géré », « Organisé », « Amélioré », « Accueilli ». Le recruteur comprend mieux votre rôle.' },
  );

  // 6. Outils et logiciels
  const outils = OUTILS.filter((o) => contient(t, [o])).length;
  regle(
    outils >= 2, 10,
    'Outils et logiciels cités.',
    'Compétences techniques trop générales.',
    { priorite: 'haute', section: 'Compétences', titre: 'Citez vos logiciels et outils', detail: `Indiquez les outils utiles pour le poste de ${poste || 'votre choix'} et votre niveau pour chacun.` },
  );

  // 7. Dates
  const annees = (brut.match(/\b(19|20)\d{2}\b/g) || []).length;
  regle(
    annees >= 2, 6,
    'Parcours daté, facile à suivre.',
    'Expériences ou formations sans dates.',
    { priorite: 'moyenne', section: 'Mise en page', titre: 'Datez chaque expérience et formation', detail: 'Indiquez au moins l’année de début et de fin, du plus récent au plus ancien.' },
  );

  // 8. Longueur
  const bonneLongueur = nbMots >= 150 && nbMots <= 650;
  regle(
    bonneLongueur, 8,
    'Longueur adaptée, lecture rapide.',
    nbMots < 150 ? 'CV très court : il manque des informations.' : 'CV trop long pour une lecture rapide.',
    nbMots < 150
      ? { priorite: 'moyenne', section: 'Contenu', titre: 'Étoffez votre CV', detail: 'Détaillez vos stages, projets, engagements associatifs et compétences : chaque expérience compte.' }
      : { priorite: 'moyenne', section: 'Mise en page', titre: 'Réduisez à une seule page', detail: 'Pour un premier emploi, une page suffit. Regroupez les formations secondaires et supprimez les détails anciens.' },
  );

  // 9. Lettre de motivation
  if (lettre) {
    const l = sansAccents(lettre);
    const nbL = l.split(/\s+/).filter(Boolean).length;
    const formule = /(madame|monsieur)/.test(l) && /(salutations|cordialement|consideration)/.test(l);
    const cite = motsPoste.length > 0 && motsPoste.some((m) => l.includes(m));
    regle(
      formule && cite && nbL >= 120 && nbL <= 500, 13,
      'Lettre de motivation ciblée sur le poste.',
      !cite ? 'La lettre ne cite pas le poste visé.' : !formule ? 'Formules d’appel ou de politesse absentes de la lettre.' : 'Longueur de la lettre à revoir.',
      { priorite: 'moyenne', section: 'Lettre', titre: !cite ? 'Citez le poste dans votre lettre' : 'Soignez la structure de la lettre', detail: 'Ouvrez par « Madame, Monsieur », citez le poste et l’entreprise, donnez deux exemples concrets, puis concluez par une formule de politesse. Visez 250 à 400 mots.' },
    );
  } else {
    points += 5;
    recos.push({ priorite: 'basse', section: 'Lettre', titre: 'Ajoutez une lettre de motivation', detail: 'Une lettre courte et ciblée augmente vos chances : déposez-la avec votre CV lors de la prochaine analyse.' });
  }

  // Total possible : 15 + 13 (coordonnées) + 29 (rubriques) + 14 + 8 + 10 + 6 + 8 + 13 (lettre) = 116.
  const score = Math.max(10, Math.min(100, Math.round((points / 116) * 100)));
  const verdict =
    score >= 85 ? 'Excellente candidature'
      : score >= 70 ? 'Bonne candidature, quelques détails'
        : score >= 50 ? 'Bonne base, à affiner'
          : 'Candidature à retravailler';

  const ordre = { haute: 0, moyenne: 1, basse: 2 };
  recos.sort((a, b) => ordre[a.priorite] - ordre[b.priorite]);
  if (forts.length === 0) forts.push('Votre candidature est déposée : chaque correction vous rapproche du poste.');
  return { score, verdict, pointsForts: forts.slice(0, 6), aCorriger: faibles.slice(0, 6), recommandations: recos };
}
