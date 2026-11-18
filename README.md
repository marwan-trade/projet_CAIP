# CAIP — interface React + Vite

Plateforme d'accompagnement vers l'emploi : modèles de CV et de lettres, analyse de candidature,
préparation aux entretiens, formation et suivi par un conseiller.

Ce dépôt contient l'**interface** (front-end). Les données sont fictives et passent par
`src/services/api.js`, prêt à être branché sur l'API Express du cahier des charges.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # version optimisée dans dist/
npm run preview    # tester la version optimisée
```

Node.js 18 ou plus récent.

| Adresse | Écran |
|---|---|
| `/` | Accueil visiteur |
| `/connexion` | Connexion et création de compte (`?mode=inscription`) |
| `/app` | Tableau de bord du candidat |
| `/app/modeles` | Bibliothèque de modèles |
| `/app/analyse/nouvelle` | Dépôt d'une candidature à analyser |
| `/app/analyse/rapport` | Rapport d'analyse |
| `/app/entretiens` | Préparation à l'entretien |
| `/app/formation` | Modules et quiz |
| `/app/accompagnement` | Suivi de la demande et messagerie |
| `/app/profil` | Profil, documents, droits (export, suppression) |
| `/conseiller` | Espace conseiller |
| `/admin` | Indicateurs et assignations |

## Organisation

```
src/
  main.jsx            point d'entrée (routeur, langue, styles)
  App.jsx             routes — chaque page est chargée à la demande
  i18n.jsx            français / anglais (navigation et libellés communs)
  styles/
    tokens.css        couleurs, typographie, espacements, dégradés
    base.css          bases, accessibilité, utilitaires
    animations.css    mouvements (désactivés si l'utilisateur le demande)
    components.css    boutons, cartes, jauge, porte, timeline…
    layout.css        barre latérale / barre haute / barre basse
    pages.css         styles propres à chaque page
  components/         Icon, ui (Button, Card, Badge…), Brand (Logo, Swoosh, Doorway), Progressions
  layouts/AppLayout   coque de l'application selon le rôle
  pages/              public/, candidat/, conseiller/, admin/
  services/api.js     accès aux données (fictives pour l'instant)
  data/mock.js        données d'exemple
```

## Identité visuelle

Tout part du logo : **une porte qui s'ouvre sur la lumière**.

- **Palette** : bleu électrique `#1A4BFF` (actions), bleu royal `#0A2FB8`, nuit `#05103F`,
  lumière cyan `#38C6FF` réservée aux fonds foncés. Contrastes conformes WCAG AA.
- **La métaphore des portes** : le parcours du candidat compte cinq portes (CV, lettre,
  analyse, entretien, formation). Elles s'illuminent à mesure qu'on les franchit.
- **Mouvements** : la porte du hero pivote et laisse passer un faisceau, l'arc lumineux du
  logo se dessine, les jauges et barres se remplissent, l'étape en cours « respire ».
  Tout est coupé si le système demande moins d'animations.
- **Typographie** : Plus Jakarta Sans (titres) et Inter (texte).

## Adaptation aux écrans

| Largeur | Navigation |
|---|---|
| moins de 768 px (téléphone) | barre en bas de l'écran, sous le pouce |
| 768 à 1023 px (tablette) | onglets en haut de l'écran |
| 1024 px et plus (ordinateur) | barre latérale |

## Performance

- Une page = un fichier JavaScript chargé à la demande (`React.lazy`).
- Pas de bibliothèque d'interface : CSS natif avec variables, quelques Ko.
- Seules dépendances : `react`, `react-dom`, `react-router-dom`.

## Brancher l'API

Dans `src/services/api.js`, remplacer chaque fonction par un appel réel, par exemple :

```js
analyses: () => request('/api/analyses'),
```

et définir l'adresse de l'API dans un fichier `.env` :

```
VITE_API_URL=http://localhost:3000
```

## Prochaines étapes

- Brancher l'authentification et l'API Express.
- Remplir en ligne un modèle (éditeur de CV).
- Comparaison détaillée de deux versions d'une analyse.
- Messagerie conseiller, gestion des contenus et des comptes côté administrateur.
- Traduire en anglais le contenu des pages (la navigation l'est déjà).
