// Génère 50 modèles de CV et 50 modèles de lettres à partir de la liste des métiers.
// Format du contenu : « # Titre » = rubrique, « - » = puce ; {{nom}}, {{email}},
// {{telephone}} sont remplacés par les informations du candidat ; [crochets] = à compléter.
import { METIERS } from './metiers.js';

const SITUATIONS = [
  { code: 'offre', nom: 'Réponse à une offre' },
  { code: 'spontanee', nom: 'Candidature spontanée' },
  { code: 'premier', nom: 'Premier emploi' },
  { code: 'reconversion', nom: 'Reconversion' },
  { code: 'stage', nom: 'Demande de stage' },
];

const SECTEUR = {
  Administration: 'de l’administration', Finance: 'de la finance', Commerce: 'du commerce', Logistique: 'de la logistique',
  BTP: 'du BTP', Informatique: 'de l’informatique', Santé: 'de la santé', Hôtellerie: 'de l’hôtellerie', Éducation: 'de l’éducation',
};

const minuscule = (s) => s.charAt(0).toLowerCase() + s.slice(1);
// « de assistant » → « d’assistant »
const de = (mot) => (/^[aeiouyhéèêâ]/i.test(mot) ? `d’${mot}` : `de ${mot}`);

function cv([poste, , profil, missions, competences, outils, formation], i) {
  const recent = i % 2 === 0;
  return `# {{nom}}
${poste}
{{email}} · {{telephone}} · Djibouti

# Profil
${poste} ${profil}. [Ajoutez en une phrase ce que vous apportez à l’employeur.]

# Expérience
[Année] – [Année] · ${poste} · [Entreprise], [ville]
${missions.map((m) => `- ${m}`).join('\n')}
${recent ? '[Année] – [Année] · Stage ou emploi précédent · [Entreprise], [ville]\n- [Verbe d’action + mission + résultat chiffré]' : '[Année] · Stage · [Entreprise], [ville]\n- [Une réalisation concrète pendant le stage]'}

# Formation
[Année] · ${formation} · [Établissement]
[Année] · Baccalauréat [série] · [Lycée]

# Compétences
Savoir-faire : ${competences}
Outils : ${outils}

# Langues
Français : [niveau] · Anglais : [niveau] · Somali, afar ou arabe : [niveau]

# Centres d’intérêt
[Une ou deux activités qui montrent une qualité utile au poste]`;
}

function lettre([poste, secteur, profil, missions], i) {
  const s = SITUATIONS[i % SITUATIONS.length];
  const p = minuscule(poste);
  const exemple = missions[0].replace('[nombre]', '[X]');
  const ouverture = {
    offre: `Votre offre pour le poste ${de(p)}, parue sur [site ou journal], a retenu toute mon attention. Je vous propose ma candidature.`,
    spontanee: `Je connais [Entreprise] pour [une qualité de l’entreprise] et je souhaiterais rejoindre vos équipes en tant que ${p}.`,
    premier: `Récemment diplômé(e) en [diplôme], je souhaite débuter ma carrière comme ${p} au sein de [Entreprise].`,
    reconversion: `Après [nombre] ans dans [ancien métier], je me reconvertis vers le métier ${de(p)}, pour lequel je me suis formé(e) à [formation].`,
    stage: `Étudiant(e) en [formation] à [établissement], je recherche un stage de [durée] à partir du [date] comme ${p}.`,
  }[s.code];
  const preuve = {
    offre: `Dans mon poste précédent chez [Entreprise], j’ai notamment ${minuscule(exemple)}.`,
    spontanee: `Lors de mes expériences précédentes, j’ai ${minuscule(exemple)}.`,
    premier: `Pendant mon stage chez [Entreprise], j’ai ${minuscule(exemple)}, ce qui m’a confirmé mon goût pour ce métier.`,
    reconversion: `Mon expérience passée m’a apporté [compétence transférable], que je mets à profit dans ce nouveau métier : en formation, j’ai déjà ${minuscule(exemple)}.`,
    stage: `Lors d’un projet de formation, j’ai ${minuscule(exemple)}, et je souhaite maintenant me confronter au terrain.`,
  }[s.code];
  return `{{nom}}
{{email}} · {{telephone}}
Djibouti, le [date]

[Nom du recruteur ou Service des ressources humaines]
[Entreprise]
[Adresse]

Objet : ${s.code === 'stage' ? `demande de stage — ${p}` : `candidature au poste ${de(p)}`}

Madame, Monsieur,

${ouverture}

${poste.charAt(0).toUpperCase() + poste.slice(1)} ${profil}, je souhaite mettre mes compétences au service de votre structure. ${preuve} J’ai également ${minuscule(missions[1].replace('[nombre]', '[X]'))}.

Rejoindre [Entreprise] représente pour moi l’occasion de [ce que vous voulez apporter ou apprendre] dans le secteur ${SECTEUR[secteur]}. Je serais heureux(se) de vous expliquer de vive voix ma motivation lors d’un entretien.

Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

{{nom}}`;
}

export function modelesMetiers() {
  const cvs = METIERS.map((m, i) => ({ type: 'cv', nom: `CV ${m[0]}`, secteur: m[1], style: i % 2 === 0 ? 'classique' : 'colonne', contenu: cv(m, i) }));
  const lettres = METIERS.map((m, i) => ({
    type: 'lettre',
    nom: `Lettre ${m[0]} · ${SITUATIONS[i % SITUATIONS.length].nom}`,
    secteur: m[1],
    style: 'lettre',
    contenu: lettre(m, i),
  }));
  return [...cvs, ...lettres];
}
