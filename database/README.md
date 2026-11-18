# Base de données CAIP

La base est construite **au fur et à mesure des pages** : chaque nouvelle page
n'ajoute que les tables et colonnes dont elle a besoin, dans un nouveau fichier
numéroté. Les fichiers existants ne sont jamais modifiés une fois appliqués.

**Pour l'instant : SQLite** (un seul fichier, rien à installer). Le SQL reste simple
pour passer à PostgreSQL ensuite. Une première version PostgreSQL des mêmes tables
est gardée dans `postgresql/` pour ce passage.

| Fichier | Pages | Contenu |
|---|---|---|
| `001_comptes.sql` | Connexion, création de compte, mot de passe oublié | `utilisateur`, `reinitialisation_mot_de_passe` |
| `002_centres_partenaires.sql` | Accueil (Partenariats), Connexion (pastilles) | `centre_partenaire` |

## Installer

Avec l'outil `sqlite3` (version 3.35 ou plus récente) :

```bash
sqlite3 caip.db < database/001_comptes.sql
sqlite3 caip.db < database/002_centres_partenaires.sql
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
