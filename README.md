# CAIP — plateforme d'accompagnement vers l'emploi

Modèles de CV et de lettres, analyse de candidature, préparation aux entretiens, formation
et suivi par un conseiller. Trois espaces : **candidat**, **conseiller**, **administrateur**.

Branche `v1` : application complète — interface React + Vite, serveur Node.js et base **MySQL**.

## Démarrer en local

```bash
npm install
npm run dev:api    # serveur sur http://localhost:3000 (base SQLite locale, sans MySQL)
npm run dev        # interface sur http://localhost:5173 (les appels /api vont au serveur)
```

Avec MySQL : définir `MYSQL_URL` (voir `.env.example`), puis `npm run build && npm start`.
Au premier démarrage sur une base vide, le serveur crée les tables
(`database/mysql/schema.sql`) et ajoute les données de démonstration.

Node.js 20 ou plus récent (22 pour le mode SQLite local).

## Comptes de démonstration

Mot de passe commun : `Caip2026!` (variable `DEMO_PASSWORD`). **À changer avant une vraie mise en service.**

| Rôle | E-mail |
|---|---|
| Candidate | `amina@exemple.com` |
| Conseiller | `ali@caip.dj` (et `deka@caip.dj`) |
| Administrateur | `admin@caip.dj` |

## Mise en ligne (Railway)

1. Nouveau projet → *Deploy from GitHub repo* → `projet_CAIP`, branche `v1`.
2. Ajouter une base **MySQL** au projet.
3. Dans le service de l'application, variable `MYSQL_URL` = `${{MySQL.MYSQL_URL}}`.
4. *Settings → Networking → Generate Domain*. Build : `npm run build`, démarrage : `npm start` (détectés automatiquement).

## Serveur

```
server/
  index.js        serveur HTTP : API sous /api, interface (dist/) pour le reste
  db.js           accès MySQL (mysql2) ou SQLite en local ; création du schéma au 1er démarrage
  seed.js         données de démonstration
  securite.js     mots de passe (scrypt), jetons de session, cookies
  analyse.js      analyse du CV et de la lettre par règles explicables (score sur 100)
  extraction.js   lecture du texte des PDF et DOCX
  routes/         auth.js, candidat.js, equipe.js (conseiller + administrateur)
```

- Sessions : cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production ; 5 essais de connexion puis blocage 15 min.
- Mot de passe oublié : tant qu'aucun service d'e-mail n'est branché, le lien s'affiche à l'écran
  (`LIEN_REINITIALISATION_A_L_ECRAN=non` pour le désactiver) et apparaît dans les journaux du serveur.
- Documents : PDF ou DOCX, 5 Mo max, type vérifié sur le contenu ; le conseiller ne voit que les documents partagés.

| Adresse | Écran |
|---|---|
| `/` | Accueil visiteur |
| `/connexion` | Connexion, création de compte (`?mode=inscription`), mot de passe oublié (`?mode=oubli`) |
| `/reinitialiser?jeton=…` | Nouveau mot de passe |
| `/app` … | Candidat : tableau de bord, modèles, analyse, rapport, entretiens, formation, accompagnement, profil |
| `/conseiller` … | Conseiller : demandes, messages, ressources |
| `/admin` … | Administrateur : indicateurs, contenus, comptes, assignations, journal d'audit |

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
  services/api.js     appels à l'API du serveur
  session.jsx         utilisateur connecté et accès par rôle
  format.js           dates et tailles
  data/mock.js        exemples de partenaires (affichés pendant le chargement)
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
