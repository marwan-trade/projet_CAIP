-- =====================================================================
-- CAIP — Migration 001 : comptes et connexion
-- Pages concernées : Connexion (connexion, création de compte,
--                    mot de passe oublié)
-- Base : PostgreSQL 14 ou plus récent
-- =====================================================================

BEGIN;

-- Rôles prévus par le cahier des charges.
-- Un visiteur qui s'inscrit devient « candidat » ; les comptes
-- « conseiller » et « administrateur » sont créés par l'administrateur.
CREATE TYPE role_utilisateur AS ENUM ('candidat', 'conseiller', 'administrateur');

CREATE TYPE langue_interface AS ENUM ('fr', 'en');

-- ---------------------------------------------------------------------
-- utilisateur : un compte, quel que soit son rôle
-- Champs remplis par le formulaire « Créer un compte » :
--   nom complet, adresse e-mail, mot de passe, case de confidentialité.
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_complet         VARCHAR(120)     NOT NULL,
    email               VARCHAR(254)     NOT NULL,
    -- Jamais le mot de passe lui-même : son empreinte Argon2 ou bcrypt.
    mot_de_passe_hash   VARCHAR(255)     NOT NULL,
    role                role_utilisateur NOT NULL DEFAULT 'candidat',
    langue              langue_interface NOT NULL DEFAULT 'fr',
    -- Date à laquelle la politique de confidentialité a été acceptée.
    cgu_acceptees_le    TIMESTAMPTZ      NOT NULL,
    actif               BOOLEAN          NOT NULL DEFAULT TRUE,
    -- Blocage temporaire après plusieurs mots de passe erronés.
    echecs_connexion    SMALLINT         NOT NULL DEFAULT 0,
    bloque_jusqu_au     TIMESTAMPTZ,
    derniere_connexion  TIMESTAMPTZ,
    cree_le             TIMESTAMPTZ      NOT NULL DEFAULT now(),
    modifie_le          TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT utilisateur_nom_non_vide   CHECK (length(trim(nom_complet)) > 0),
    CONSTRAINT utilisateur_email_format   CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT utilisateur_echecs_positif CHECK (echecs_connexion >= 0)
);

-- Une adresse e-mail = un seul compte, sans tenir compte des majuscules.
CREATE UNIQUE INDEX utilisateur_email_unique ON utilisateur (lower(email));

-- ---------------------------------------------------------------------
-- reinitialisation_mot_de_passe : liens envoyés par « Mot de passe oublié »
-- Le lien contient un jeton aléatoire ; seule son empreinte est stockée.
-- ---------------------------------------------------------------------
CREATE TABLE reinitialisation_mot_de_passe (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id  BIGINT       NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    jeton_hash      CHAR(64)     NOT NULL UNIQUE,   -- SHA-256 du jeton, en hexadécimal
    expire_le       TIMESTAMPTZ  NOT NULL,
    utilise_le      TIMESTAMPTZ,                    -- rempli quand le nouveau mot de passe est choisi
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT reinit_expiration_apres_creation CHECK (expire_le > cree_le)
);

CREATE INDEX reinit_par_utilisateur ON reinitialisation_mot_de_passe (utilisateur_id);

-- ---------------------------------------------------------------------
-- Mise à jour automatique de « modifie_le »
-- ---------------------------------------------------------------------
CREATE FUNCTION maj_modifie_le() RETURNS trigger AS $$
BEGIN
    NEW.modifie_le := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER utilisateur_modifie_le
    BEFORE UPDATE ON utilisateur
    FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();

COMMIT;
