-- =====================================================================
-- CAIP — Migration 001 : comptes et connexion
-- Pages concernées : Connexion (connexion, création de compte,
--                    mot de passe oublié)
-- SQL simple, testé avec SQLite 3.35 ou plus récent.
-- (La version PostgreSQL est dans database/postgresql/.)
-- =====================================================================

-- SQLite n'applique les clés étrangères que si on le lui demande,
-- à chaque connexion.
PRAGMA foreign_keys = ON;

BEGIN;

-- ---------------------------------------------------------------------
-- utilisateur : un compte, quel que soit son rôle
-- Champs remplis par le formulaire « Créer un compte » :
--   nom complet, adresse e-mail, mot de passe, case de confidentialité.
-- Un visiteur qui s'inscrit devient « candidat » ; les comptes
-- « conseiller » et « administrateur » sont créés par l'administrateur.
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id                  INTEGER      PRIMARY KEY AUTOINCREMENT,
    nom_complet         VARCHAR(120) NOT NULL CHECK (length(trim(nom_complet)) > 0),
    email               VARCHAR(254) NOT NULL CHECK (email LIKE '%_@_%._%' AND email NOT LIKE '% %'),
    -- Jamais le mot de passe lui-même : son empreinte Argon2 ou bcrypt.
    mot_de_passe_hash   VARCHAR(255) NOT NULL,
    role                VARCHAR(20)  NOT NULL DEFAULT 'candidat'
                        CHECK (role IN ('candidat', 'conseiller', 'administrateur')),
    langue              CHAR(2)      NOT NULL DEFAULT 'fr' CHECK (langue IN ('fr', 'en')),
    -- Date à laquelle la politique de confidentialité a été acceptée.
    cgu_acceptees_le    TIMESTAMP    NOT NULL,
    actif               BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Blocage temporaire après plusieurs mots de passe erronés.
    echecs_connexion    SMALLINT     NOT NULL DEFAULT 0 CHECK (echecs_connexion >= 0),
    bloque_jusqu_au     TIMESTAMP,
    derniere_connexion  TIMESTAMP,
    cree_le             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifie_le          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Une adresse e-mail = un seul compte, sans tenir compte des majuscules.
CREATE UNIQUE INDEX utilisateur_email_unique ON utilisateur (lower(email));

-- ---------------------------------------------------------------------
-- reinitialisation_mot_de_passe : liens envoyés par « Mot de passe oublié »
-- Le lien contient un jeton aléatoire ; seule son empreinte est stockée.
-- ---------------------------------------------------------------------
CREATE TABLE reinitialisation_mot_de_passe (
    id              INTEGER   PRIMARY KEY AUTOINCREMENT,
    utilisateur_id  INTEGER   NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    jeton_hash      CHAR(64)  NOT NULL UNIQUE,   -- SHA-256 du jeton, en hexadécimal
    expire_le       TIMESTAMP NOT NULL,
    utilise_le      TIMESTAMP,                   -- rempli quand le nouveau mot de passe est choisi
    cree_le         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expire_le > cree_le)
);

CREATE INDEX reinit_par_utilisateur ON reinitialisation_mot_de_passe (utilisateur_id);

-- ---------------------------------------------------------------------
-- Mise à jour automatique de « modifie_le »
-- ---------------------------------------------------------------------
CREATE TRIGGER utilisateur_modifie_le
AFTER UPDATE ON utilisateur
FOR EACH ROW WHEN NEW.modifie_le = OLD.modifie_le
BEGIN
    UPDATE utilisateur SET modifie_le = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

COMMIT;
