# Base de données CAIP

| Dossier | Rôle |
|---|---|
| `mysql/schema.sql` | **Schéma utilisé par la v1** (MySQL 8.0.16+). Exécuté automatiquement par le serveur sur une base vide. |
| `sqlite/` | Premières migrations, page par page (tableau de bord), et requêtes de lecture. Historique. |
| `postgresql/` | Version PostgreSQL des premières tables, pour la migration prévue plus tard. |

Tables de la v1 : `utilisateur`, `session_utilisateur`, `reinitialisation_mot_de_passe`, `centre_partenaire`,
`document`, `analyse`, `recommandation`, `modele`, `utilisation_modele`, `theme_entretien`,
`question_entretien`, `module_formation`, `question_quiz`, `progression_module`,
`demande_accompagnement`, `message`, `journal_audit`, `schema_version`.

Règles portées par le serveur plutôt que par des déclencheurs (pour rester simple et portable) :
rôles du candidat et du conseiller d'une demande, mise à jour de `modifie_le`, e-mail en minuscules.

Évolution du schéma : ajouter un fichier `mysql/002_….sql` et incrémenter `schema_version`
(le serveur n'exécute aujourd'hui que la version 1).
