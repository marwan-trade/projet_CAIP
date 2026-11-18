# Base de données CAIP

La base est construite **au fur et à mesure des pages** : chaque nouvelle page
n'ajoute que les tables et colonnes dont elle a besoin, dans un nouveau fichier
numéroté. Les fichiers existants ne sont jamais modifiés une fois appliqués.

**Pour l'instant : SQLite** (un seul fichier, rien à installer). Le SQL reste simple
pour passer à PostgreSQL ensuite. Une première version PostgreSQL des migrations 001
et 002 est gardée dans `postgresql/` pour ce passage.

| Fichier | Pages | Contenu |
|---|---|---|
| `001_comptes.sql` | Connexion, création de compte, mot de passe oublié | `utilisateur`, `reinitialisation_mot_de_passe` |
| `002_centres_partenaires.sql` | Accueil (Partenariats), Connexion (pastilles) | `centre_partenaire` |
| `003_tableau_de_bord.sql` | Tableau de bord du candidat | `document`, `analyse`, `recommandation`, `module_formation`, `progression_module`, `demande_accompagnement` ; colonne `specialite` du conseiller |

Le dossier `requetes/` contient les requêtes de lecture de chaque page
(par exemple `requetes/tableau_de_bord.sql`), prêtes pour le serveur.

## Installer

Avec l'outil `sqlite3` (version 3.35 ou plus récente) :

```bash
sqlite3 caip.db < database/001_comptes.sql
sqlite3 caip.db < database/002_centres_partenaires.sql
sqlite3 caip.db < database/003_tableau_de_bord.sql
```

Les fichiers s'appliquent dans l'ordre des numéros.

**Important avec SQLite :** les clés étrangères ne sont vérifiées que si la connexion
le demande. L'application doit exécuter `PRAGMA foreign_keys = ON;` à chaque ouverture
de la base, sinon la suppression d'un compte ne supprime pas ses liens de réinitialisation.

## Correspondance avec les pages

**Créer un compte** → une ligne dans `utilisateur` :
nom complet, e-mail (unique, sans tenir compte des majuscules), empreinte du mot de
passe (Argon2 ou bcrypt, jamais le mot de passe en clair), rôle `candidat`, date
d'acceptation de la politique de confidentialité. La confirmation du mot de passe
est vérifiée par le formulaire et n'est pas stockée.

**Connexion** → lecture de `utilisateur` par e-mail. `echecs_connexion` et
`bloque_jusqu_au` servent au blocage temporaire après plusieurs mots de passe erronés.

**Mot de passe oublié** → une ligne dans `reinitialisation_mot_de_passe` : empreinte
du jeton envoyé par e-mail, date d'expiration, date d'utilisation.

**Conseillers et administrateurs** → même table `utilisateur`, avec le rôle
`conseiller` ou `administrateur`. Ces comptes sont créés par l'administrateur.

**Partenaires** → `centre_partenaire` : nom, logo, site, ordre d'affichage, visibilité.

**Tableau de bord** → seulement ce que la page affiche :

| Bloc de la page | Tables lues |
|---|---|
| Parcours en 5 portes | `document` (CV, lettre), `analyse`, `progression_module` |
| Prochaine action | `recommandation` de priorité `haute` non corrigées, dernière analyse |
| Score de mon CV, historique | `analyse` (score, poste visé, CV seul ou CV + lettre) |
| Formation | `module_formation` (6 modules créés par la migration), `progression_module` |
| Accompagnement | `demande_accompagnement`, conseiller dans `utilisateur` |

Règles à connaître :
- un module sans ligne dans `progression_module` est « à venir » ;
- la porte « Entretien » est provisoirement franchie quand le module 3
  « Se présenter en entretien » est validé (à revoir avec la page Entretiens) ;
- une demande assignée, en cours ou clôturée a forcément un conseiller, qui doit
  avoir le rôle `conseiller` ; un conseiller qui a des demandes ne peut pas être
  supprimé (les réassigner d'abord, ou désactiver son compte) ;
- supprimer un compte candidat supprime toutes ses données (documents, analyses,
  progression, demandes).

## Passer à PostgreSQL plus tard

Ce qui change :

| SQLite (maintenant) | PostgreSQL |
|---|---|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` |
| `role` en texte + `CHECK (role IN (…))` | type `ENUM` (ou garder le `CHECK`) |
| `TIMESTAMP` | `TIMESTAMPTZ` (avec fuseau horaire) |
| `PRAGMA foreign_keys = ON` | inutile, toujours actif |
| déclencheur `AFTER UPDATE … UPDATE …` | fonction `plpgsql` + déclencheur `BEFORE UPDATE` |
| vérification d'e-mail avec `LIKE` | expression régulière `~` |

Les noms de tables et de colonnes restent identiques : le code de l'application
n'a pas à changer.

## Prochaines migrations

Elles viendront avec les pages correspondantes : modèles de documents, candidatures
et analyses, formation, accompagnement, etc.
