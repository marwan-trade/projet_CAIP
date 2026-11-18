// Données d'exemple pour les maquettes. Elles seront remplacées par
// les réponses de l'API Express (voir src/services/api.js).

export const candidat = {
  id: 'u-001',
  prenom: 'Amina',
  nom: 'Hassan',
  initiales: 'AH',
  email: 'amina.hassan@exemple.com',
  telephone: '+253 77 00 00 00',
  secteur: 'Comptabilité',
  posteVise: 'Assistante comptable',
  consentementAnalyse: '8 nov. 2026',
};

// Les « portes » du parcours : la métaphore du logo.
export const parcours = [
  { id: 'cv', label: 'CV', etat: 'fait' },
  { id: 'lettre', label: 'Lettre', etat: 'fait' },
  { id: 'analyse', label: 'Analyse', etat: 'fait' },
  { id: 'entretien', label: 'Entretien', etat: 'en-cours' },
  { id: 'formation', label: 'Formation', etat: 'a-venir' },
];

export const analyses = [
  { id: 'a-2', date: '12 nov. 2026', document: 'CV + lettre (v2)', poste: 'Assistante comptable', score: 64 },
  { id: 'a-1', date: '8 nov. 2026', document: 'CV (v1)', poste: 'Assistante comptable', score: 52 },
];

export const rapport = {
  id: 'a-2',
  date: '12 nov. 2026',
  poste: 'Assistante comptable',
  documents: 'CV + lettre',
  score: 64,
  scorePrecedent: 52,
  verdict: 'Bonne base, à affiner',
  pointsForts: [
    'Formation clairement présentée, avec diplôme et année.',
    'Stage en cabinet comptable cohérent avec le poste visé.',
    'Rubriques dans un ordre logique et facile à lire.',
    'Langues indiquées avec le niveau.',
  ],
  aCorriger: [
    'Expériences décrites sans résultats concrets.',
    'Aucun titre de poste en haut du CV.',
    'Compétences techniques trop générales.',
    'CV sur deux pages pour un premier emploi.',
  ],
  recommandations: [
    { id: 1, priorite: 'Haute', section: 'Expérience', titre: 'Chiffrez vos réalisations', detail: 'Remplacez « suivi des factures » par un résultat mesurable, par exemple le nombre de factures traitées par mois.' },
    { id: 2, priorite: 'Haute', section: 'Profil', titre: 'Ajoutez un titre adapté au poste', detail: 'Placez « Assistante comptable » en haut du CV pour que le recruteur voie tout de suite le poste visé.' },
    { id: 3, priorite: 'Haute', section: 'Compétences', titre: 'Citez vos logiciels de comptabilité', detail: 'Le poste demande la maîtrise d’outils comptables : indiquez ceux que vous connaissez et votre niveau.' },
    { id: 4, priorite: 'Moyenne', section: 'Mise en page', titre: 'Réduisez à une seule page', detail: 'Pour un premier emploi, une page suffit. Regroupez les formations secondaires.' },
    { id: 5, priorite: 'Basse', section: 'Coordonnées', titre: 'Utilisez une adresse e-mail professionnelle', detail: 'Préférez une adresse de la forme prenom.nom@…' },
  ],
};

export const modeles = [
  { id: 'm1', type: 'cv', nom: 'CV Classique', secteur: 'Administration', style: 'classique' },
  { id: 'm2', type: 'cv', nom: 'CV Moderne', secteur: 'Commerce', style: 'colonne' },
  { id: 'm3', type: 'cv', nom: 'CV Premier emploi', secteur: 'Tous secteurs', style: 'classique' },
  { id: 'm4', type: 'cv', nom: 'CV Reconversion', secteur: 'Tous secteurs', style: 'colonne' },
  { id: 'm5', type: 'cv', nom: 'CV Technique', secteur: 'Informatique', style: 'classique' },
  { id: 'm6', type: 'cv', nom: 'CV Santé', secteur: 'Santé', style: 'colonne' },
  { id: 'm7', type: 'cv', nom: 'CV Compact', secteur: 'Commerce', style: 'classique' },
  { id: 'm8', type: 'cv', nom: 'CV Bilingue', secteur: 'Administration', style: 'colonne' },
  { id: 'l1', type: 'lettre', nom: 'Réponse à une offre', secteur: 'Tous secteurs', style: 'lettre' },
  { id: 'l2', type: 'lettre', nom: 'Candidature spontanée', secteur: 'Commerce', style: 'lettre' },
  { id: 'l3', type: 'lettre', nom: 'Premier emploi', secteur: 'Tous secteurs', style: 'lettre' },
  { id: 'l4', type: 'lettre', nom: 'Reconversion', secteur: 'Tous secteurs', style: 'lettre' },
  { id: 'l5', type: 'lettre', nom: 'Demande de stage', secteur: 'Administration', style: 'lettre' },
];

export const secteurs = ['Tous', 'Administration', 'Commerce', 'Santé', 'Informatique'];

export const themesEntretien = [
  {
    id: 'frequentes',
    label: 'Questions fréquentes',
    intro: 'Les questions posées dans presque tous les entretiens.',
    questions: [
      { q: 'Parlez-moi de vous.', attendu: 'Votre capacité à résumer votre parcours en lien avec le poste.', conseil: 'Deux à trois minutes : formation, expérience clé, ce qui vous amène ici.' },
      { q: 'Pourquoi ce poste vous intéresse-t-il ?', attendu: 'Votre motivation et ce que vous savez de l’entreprise.', conseil: 'Citez un élément précis de l’offre ou de l’entreprise.' },
      { q: 'Quelles sont vos qualités et vos défauts ?', attendu: 'Votre lucidité sur vous-même.', conseil: 'Pour un défaut, montrez ce que vous faites pour progresser.' },
      { q: 'Où vous voyez-vous dans cinq ans ?', attendu: 'Si votre projet est cohérent avec le poste.', conseil: 'Restez réaliste et liez votre réponse au poste proposé.' },
    ],
  },
  {
    id: 'parcours',
    label: 'Présenter son parcours',
    intro: 'Raconter son parcours de façon claire et convaincante.',
    questions: [
      { q: 'Comment expliquer un trou dans mon CV ?', attendu: 'Votre honnêteté et ce que vous avez fait de cette période.', conseil: 'Restez bref et montrez ce que vous avez appris.' },
      { q: 'Comment valoriser un premier emploi ?', attendu: 'Vos stages, projets et engagements.', conseil: 'Appuyez-vous sur des exemples concrets et chiffrés.' },
    ],
  },
  {
    id: 'comportement',
    label: 'Comportement',
    intro: 'Attitude, tenue et communication non verbale.',
    questions: [
      { q: 'Comment gérer le stress le jour J ?', attendu: 'Votre capacité à rester posé.', conseil: 'Arrivez 10 minutes en avance et préparez trois exemples.' },
      { q: 'Que faire si je ne connais pas la réponse ?', attendu: 'Votre honnêteté et votre réflexion.', conseil: 'Dites-le simplement et expliquez comment vous chercheriez.' },
    ],
  },
  {
    id: 'questions',
    label: 'Questions à poser',
    intro: 'Montrer son intérêt en fin d’entretien.',
    questions: [
      { q: 'Quelles questions poser au recruteur ?', attendu: 'Votre intérêt réel pour le poste.', conseil: 'Demandez à quoi ressemble une journée type ou les objectifs des premiers mois.' },
    ],
  },
  {
    id: 'erreurs',
    label: 'Erreurs courantes',
    intro: 'Ce qu’il vaut mieux éviter.',
    questions: [
      { q: 'Les erreurs les plus fréquentes', attendu: 'Votre préparation.', conseil: 'Ne pas connaître l’entreprise, critiquer un ancien employeur, arriver en retard.' },
    ],
  },
];

export const modules = [
  { n: 1, titre: 'Construire son projet professionnel', etat: 'valide' },
  { n: 2, titre: 'Rédiger un CV efficace', etat: 'valide' },
  { n: 3, titre: 'Se présenter en entretien', etat: 'en-cours', question: 2, total: 5 },
  { n: 4, titre: 'Répondre aux questions difficiles', etat: 'a-venir' },
  { n: 5, titre: 'Négocier et conclure', etat: 'a-venir' },
  { n: 6, titre: "Après l'entretien", etat: 'a-venir' },
];

export const quiz = {
  question: "Combien de temps viser pour vous présenter au début d'un entretien ?",
  options: ['30 secondes', '2 à 3 minutes', '10 minutes', 'Autant que nécessaire'],
  bonne: 1,
  explicationBonne: 'Deux à trois minutes suffisent : votre parcours, vos atouts pour le poste et ce qui vous motive.',
  explicationFausse: "Visez plutôt deux à trois minutes : assez pour convaincre, sans perdre l'attention du recruteur.",
};

export const accompagnement = {
  envoyee: '10 nov. 2026',
  objectif: 'Obtenir un premier poste en comptabilité',
  disponibilites: 'Matinées en semaine',
  conseiller: { nom: 'M. Ali', initiales: 'MA', specialite: 'Premier emploi' },
  etapes: [
    { label: 'Reçue', quand: '10 nov. · 09:14', etat: 'fait' },
    { label: 'Assignée à M. Ali', quand: '10 nov. · 15:40', etat: 'fait' },
    { label: 'En cours', quand: 'depuis le 11 nov.', etat: 'en-cours' },
    { label: 'Clôturée', quand: '', etat: 'a-venir' },
  ],
  documents: [{ nom: 'CV_Amina_Hassan.pdf', partage: true }],
  messages: [
    { de: 'conseiller', texte: "Bonjour Amina, j'ai lu votre CV. Votre stage est un vrai atout. Pouvons-nous en parler jeudi à 10 h ?", heure: '10:02' },
    { de: 'moi', texte: 'Oui, jeudi 10 h me convient. Merci beaucoup !', heure: '10:20' },
    { de: 'conseiller', texte: "Parfait. D'ici là, essayez de corriger les recommandations prioritaires du rapport.", heure: '10:24' },
  ],
};

export const mesDocuments = [
  { nom: 'CV_Amina_Hassan.pdf', date: '12 nov. 2026', partage: true },
  { nom: 'CV_Amina_v1.pdf', date: '8 nov. 2026', partage: false },
  { nom: 'Lettre_comptable.docx', date: '12 nov. 2026', partage: false },
];

export const demandesConseiller = [
  { id: 1, initiales: 'HO', nom: 'Hassan Omar', statut: 'Assignée', date: '7 nov. 2026', age: 'Sans réponse depuis 3 jours', enRetard: true, situation: '10 ans dans le commerce, en reconversion', objectif: 'Se reconvertir dans la logistique', dispo: 'Après-midi', document: 'CV_Hassan_Omar.pdf', score: 58 },
  { id: 2, initiales: 'AH', nom: 'Amina Hassan', statut: 'En cours', date: '10 nov. 2026', age: 'Dernier message il y a 1 jour', situation: 'Jeune diplômée en comptabilité', objectif: 'Obtenir un premier poste en comptabilité', dispo: 'Matinées en semaine', document: 'CV_Amina_Hassan.pdf', score: 64 },
  { id: 3, initiales: 'FA', nom: 'Fatouma Ali', statut: 'En cours', date: '9 nov. 2026', age: 'Dernier message il y a 2 jours', situation: 'En poste depuis 4 ans', objectif: 'Évoluer vers un poste de responsable', dispo: 'Le soir' },
  { id: 4, initiales: 'IM', nom: 'Ibrahim Moussa', statut: 'Assignée', date: '11 nov. 2026', age: 'Reçue hier', situation: 'Technicien, recherche active', objectif: 'Préparer un entretien la semaine prochaine', dispo: 'Toute la journée', document: 'CV_Ibrahim.pdf', score: 71 },
  { id: 5, initiales: 'SA', nom: 'Safia Ahmed', statut: 'Clôturée', date: '28 oct. 2026', age: 'Clôturée le 6 nov.', situation: 'Jeune diplômée', objectif: 'Relecture de lettre', dispo: 'Matin' },
];

// Cibles reprises du cahier des charges ; valeurs d'exemple.
export const indicateurs = {
  periodes: [
    { id: '7', label: '7 jours' },
    { id: '30', label: '30 jours' },
    { id: '90', label: '90 jours' },
  ],
  definitions: [
    { label: 'Comptes créés', cible: '≥ 500 à 6 mois' },
    { label: 'Modèle → document téléchargé', cible: '≥ 60 %' },
    { label: 'Candidatures soumises à l’analyse', cible: '≥ 40 % des actifs' },
    { label: 'Satisfaction recommandations', cible: '≥ 4,0 / 5' },
    { label: 'Délai moyen de réponse', cible: '≤ 48 h ouvrées' },
    { label: 'Disponibilité du service', cible: '≥ 99 %' },
  ],
  valeurs: {
    7: [['134', null], ['58 %', false], ['37 %', false], ['4,2 / 5', true], ['31 h', true], ['99,8 %', true]],
    30: [['412', null], ['63 %', true], ['41 %', true], ['4,1 / 5', true], ['36 h', true], ['99,6 %', true]],
    90: [['1 086', true], ['61 %', true], ['44 %', true], ['4,0 / 5', true], ['44 h', true], ['99,4 %', true]],
  },
  aAssigner: [
    { nom: 'Nasra Djama', besoin: 'Préparer un entretien', recue: "Aujourd'hui" },
    { nom: 'Abdi Youssouf', besoin: 'Relecture de CV', recue: 'Hier' },
  ],
  conseillers: [
    { nom: 'Mme Deka', charge: 3 },
    { nom: 'M. Ali', charge: 6 },
  ],
  contenus: [
    ['Modèles de CV', 8],
    ['Modèles de lettres', 5],
    ["Thèmes d'entretien", 5],
    ['Questions types', 30],
    ['Modules de formation', 6],
  ],
};

// Premiers centres de formation partenaires.
// Pour ajouter un vrai partenaire : mettre son nom, déposer son logo dans
// public/partenaires/ et indiquer le chemin, par exemple 'partenaires/centre-x.png'.
export const partenaires = [
  { nom: '[Partenaire 1]', logo: null, site: null },
  { nom: '[Partenaire 2]', logo: null, site: null },
  { nom: '[Partenaire 3]', logo: null, site: null },
  { nom: '[Partenaire 4]', logo: null, site: null },
];
