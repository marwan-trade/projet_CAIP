# Base de données CAIP (PostgreSQL)

La base est construite **au fur et à mesure des pages** : chaque nouvelle page
n'ajoute que les tables et colonnes dont elle a besoin, dans un nouveau fichier
numéroté. Les fichiers existants ne sont jamais modifiés une fois appliqués.

| Fichier | Pages | Contenu |
|---|---|---|
| `001_comptes.sql` | Connexion, création de compte, mot de passe oublié | `utilisateur`, `reinitialisation_mot_de_passe` |
| `002_centres_partenaires.sql` | Accueil (Partenariats), Connexion (pastilles) | `centre_partenaire` |

## Installer

```bash
createdb caip
psql -d caip -v ON_ERROR_STOP=1 -f database/001_comptes.sql
psql -d caip -v ON_ERROR_STOP=1 -f database/002_centres_partenaires.sql
```

Les fichiers s'appliquent dans l'ordre des numéros.

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

## Prochaines migrations

Elles viendront avec les pages correspondantes : modèles de documents, candidatures
et analyses, formation, accompagnement, etc.
