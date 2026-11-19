-- =====================================================================
-- CAIP — schéma MySQL (version 1)
-- MySQL 8.0.16 ou plus récent (contraintes CHECK).
-- Le serveur l'exécute automatiquement au premier démarrage, sur une base
-- vide, puis ajoute les données de démonstration (server/db/seed.js).
--
-- Règles d'écriture (pour que le même fichier serve aussi aux tests SQLite) :
--   - une instruction par bloc, terminée par « ; » en fin de ligne ;
--   - pas de déclencheurs ni de procédures : les règles sont dans le serveur ;
--   - dates en DATETIME, toujours en UTC ;
--   - listes (points forts, choix de quiz…) en JSON dans une colonne TEXT.
-- =====================================================================

CREATE TABLE schema_version (
    version     INT          NOT NULL PRIMARY KEY,
    applique_le DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Comptes : candidats, conseillers, administrateurs
-- L'e-mail est toujours enregistré en minuscules.
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id                      INT          AUTO_INCREMENT PRIMARY KEY,
    nom_complet             VARCHAR(120) NOT NULL,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash       VARCHAR(255) NOT NULL,
    role                    VARCHAR(20)  NOT NULL DEFAULT 'candidat',
    langue                  VARCHAR(2)   NOT NULL DEFAULT 'fr',
    telephone               VARCHAR(30),
    secteur                 VARCHAR(120),
    poste_vise              VARCHAR(150),
    specialite              VARCHAR(120),
    capacite                INT          NOT NULL DEFAULT 8,
    cgu_acceptees_le        DATETIME     NOT NULL,
    consentement_analyse_le DATETIME,
    actif                   TINYINT(1)   NOT NULL DEFAULT 1,
    echecs_connexion        INT          NOT NULL DEFAULT 0,
    bloque_jusqu_au         DATETIME,
    derniere_connexion      DATETIME,
    cree_le                 DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifie_le              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('candidat', 'conseiller', 'administrateur')),
    CHECK (langue IN ('fr', 'en')),
    CHECK (capacite > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions : le navigateur garde un jeton aléatoire, la base n'en garde que l'empreinte.
CREATE TABLE session_utilisateur (
    jeton_hash      CHAR(64)     NOT NULL PRIMARY KEY,
    utilisateur_id  INT          NOT NULL,
    expire_le       DATETIME     NOT NULL,
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reinitialisation_mot_de_passe (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT          NOT NULL,
    jeton_hash      CHAR(64)     NOT NULL UNIQUE,
    expire_le       DATETIME     NOT NULL,
    utilise_le      DATETIME,
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Centres de formation partenaires (page d'accueil et page de connexion)
-- ---------------------------------------------------------------------
CREATE TABLE centre_partenaire (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(150) NOT NULL UNIQUE,
    logo_url    VARCHAR(500),
    site_url    VARCHAR(500),
    ordre       INT          NOT NULL DEFAULT 0,
    visible     TINYINT(1)   NOT NULL DEFAULT 1,
    cree_le     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Documents déposés (CV et lettres). Le fichier et son texte sont gardés
-- 12 mois au maximum ; le candidat peut les supprimer à tout moment.
-- ---------------------------------------------------------------------
CREATE TABLE document (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT          NOT NULL,
    type            VARCHAR(10)  NOT NULL,
    nom_fichier     VARCHAR(255) NOT NULL,
    mime            VARCHAR(120),
    taille          INT          NOT NULL DEFAULT 0,
    fichier         LONGBLOB,
    texte           MEDIUMTEXT,
    partage         TINYINT(1)   NOT NULL DEFAULT 0,
    depose_le       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('cv', 'lettre')),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX document_par_utilisateur ON document (utilisateur_id, type);

-- ---------------------------------------------------------------------
-- Analyses et recommandations
-- ---------------------------------------------------------------------
CREATE TABLE analyse (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT          NOT NULL,
    cv_id           INT,
    lettre_id       INT,
    poste_vise      VARCHAR(150) NOT NULL,
    score           INT          NOT NULL,
    verdict         VARCHAR(120) NOT NULL,
    points_forts    TEXT         NOT NULL,
    a_corriger      TEXT         NOT NULL,
    note_utilite    INT,
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (score BETWEEN 0 AND 100),
    CHECK (note_utilite IS NULL OR note_utilite BETWEEN 1 AND 5),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES document (id) ON DELETE SET NULL,
    FOREIGN KEY (lettre_id) REFERENCES document (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX analyse_par_utilisateur ON analyse (utilisateur_id, cree_le);

CREATE TABLE recommandation (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    analyse_id  INT          NOT NULL,
    priorite    VARCHAR(10)  NOT NULL,
    section     VARCHAR(60)  NOT NULL,
    titre       VARCHAR(200) NOT NULL,
    detail      TEXT         NOT NULL,
    signalee    TINYINT(1)   NOT NULL DEFAULT 0,
    corrigee_le DATETIME,
    CHECK (priorite IN ('haute', 'moyenne', 'basse')),
    FOREIGN KEY (analyse_id) REFERENCES analyse (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX recommandation_par_analyse ON recommandation (analyse_id, priorite);

-- ---------------------------------------------------------------------
-- Modèles de CV et de lettres, et leur utilisation (indicateur « modèle → document »)
-- ---------------------------------------------------------------------
CREATE TABLE modele (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(10)  NOT NULL,
    nom         VARCHAR(120) NOT NULL,
    secteur     VARCHAR(80)  NOT NULL DEFAULT 'Tous secteurs',
    style       VARCHAR(20)  NOT NULL DEFAULT 'classique',
    contenu     TEXT         NOT NULL,
    publie      TINYINT(1)   NOT NULL DEFAULT 1,
    cree_le     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('cv', 'lettre')),
    CHECK (style IN ('classique', 'colonne', 'lettre'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE utilisation_modele (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    modele_id       INT          NOT NULL,
    utilisateur_id  INT          NOT NULL,
    action          VARCHAR(12)  NOT NULL,
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (action IN ('apercu', 'telecharge')),
    FOREIGN KEY (modele_id) REFERENCES modele (id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Préparation aux entretiens
-- ---------------------------------------------------------------------
CREATE TABLE theme_entretien (
    id      INT          AUTO_INCREMENT PRIMARY KEY,
    code    VARCHAR(40)  NOT NULL UNIQUE,
    label   VARCHAR(120) NOT NULL,
    intro   VARCHAR(300) NOT NULL,
    ordre   INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_entretien (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    theme_id    INT          NOT NULL,
    question    VARCHAR(300) NOT NULL,
    attendu     TEXT         NOT NULL,
    conseil     TEXT         NOT NULL,
    ordre       INT          NOT NULL DEFAULT 0,
    FOREIGN KEY (theme_id) REFERENCES theme_entretien (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Formation : modules, questions de quiz, progression de chaque candidat
-- Un module sans ligne de progression est « à venir ».
-- ---------------------------------------------------------------------
CREATE TABLE module_formation (
    id      INT          AUTO_INCREMENT PRIMARY KEY,
    numero  INT          NOT NULL UNIQUE,
    titre   VARCHAR(150) NOT NULL,
    CHECK (numero > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_quiz (
    id                  INT          AUTO_INCREMENT PRIMARY KEY,
    module_id           INT          NOT NULL,
    ordre               INT          NOT NULL,
    question            VARCHAR(300) NOT NULL,
    choix               TEXT         NOT NULL,
    bonne               INT          NOT NULL,
    explication_bonne   TEXT         NOT NULL,
    explication_fausse  TEXT         NOT NULL,
    FOREIGN KEY (module_id) REFERENCES module_formation (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE progression_module (
    utilisateur_id      INT          NOT NULL,
    module_id           INT          NOT NULL,
    statut              VARCHAR(10)  NOT NULL DEFAULT 'en_cours',
    question_courante   INT          NOT NULL DEFAULT 1,
    bonnes_reponses     INT          NOT NULL DEFAULT 0,
    valide_le           DATETIME,
    PRIMARY KEY (utilisateur_id, module_id),
    CHECK (statut IN ('en_cours', 'valide')),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES module_formation (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Accompagnement : demande, conseiller assigné, messages
-- Une demande assignée, en cours ou clôturée a forcément un conseiller.
-- ---------------------------------------------------------------------
CREATE TABLE demande_accompagnement (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    candidat_id     INT          NOT NULL,
    conseiller_id   INT,
    statut          VARCHAR(10)  NOT NULL DEFAULT 'recue',
    objectif        VARCHAR(300) NOT NULL,
    situation       VARCHAR(300),
    disponibilites  VARCHAR(150),
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assignee_le     DATETIME,
    en_cours_le     DATETIME,
    cloturee_le     DATETIME,
    modifie_le      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (statut IN ('recue', 'assignee', 'en_cours', 'cloturee')),
    CHECK (statut = 'recue' OR conseiller_id IS NOT NULL),
    FOREIGN KEY (candidat_id) REFERENCES utilisateur (id) ON DELETE CASCADE,
    FOREIGN KEY (conseiller_id) REFERENCES utilisateur (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX demande_par_candidat ON demande_accompagnement (candidat_id, cree_le);
CREATE INDEX demande_par_conseiller ON demande_accompagnement (conseiller_id, statut);

CREATE TABLE message (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    demande_id  INT          NOT NULL,
    auteur_id   INT          NOT NULL,
    texte       TEXT         NOT NULL,
    lu_le       DATETIME,
    cree_le     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (demande_id) REFERENCES demande_accompagnement (id) ON DELETE CASCADE,
    FOREIGN KEY (auteur_id) REFERENCES utilisateur (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX message_par_demande ON message (demande_id, cree_le);

-- ---------------------------------------------------------------------
-- Journal d'audit (page Administration › Audit)
-- ---------------------------------------------------------------------
CREATE TABLE journal_audit (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT,
    action          VARCHAR(60)  NOT NULL,
    detail          VARCHAR(500),
    cree_le         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX journal_par_date ON journal_audit (cree_le);

INSERT INTO schema_version (version) VALUES (1);
