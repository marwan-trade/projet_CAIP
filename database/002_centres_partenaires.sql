-- =====================================================================
-- CAIP — Migration 002 : centres de formation partenaires
-- Pages concernées : Accueil (section Partenariats),
--                    Connexion (pastilles des partenaires)
-- SQL simple, testé avec SQLite 3.35 ou plus récent.
-- (La version PostgreSQL est dans database/postgresql/.)
-- =====================================================================

PRAGMA foreign_keys = ON;

BEGIN;

-- Les centres affichés sur l'accueil et la page de connexion.
-- Ils sont gérés par l'administrateur.
CREATE TABLE centre_partenaire (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    nom         VARCHAR(150) NOT NULL CHECK (length(trim(nom)) > 0),
    logo_url    VARCHAR(500),                     -- chemin ou adresse du logo ; vide = pastille par défaut
    site_url    VARCHAR(500)                      -- rend le logo cliquable
                CHECK (site_url IS NULL OR site_url LIKE 'http://%' OR site_url LIKE 'https://%'),
    ordre       SMALLINT     NOT NULL DEFAULT 0,  -- ordre d'affichage
    visible     BOOLEAN      NOT NULL DEFAULT TRUE,
    cree_le     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifie_le  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX partenaire_nom_unique ON centre_partenaire (lower(nom));
CREATE INDEX partenaire_affichage ON centre_partenaire (visible, ordre);

CREATE TRIGGER centre_partenaire_modifie_le
AFTER UPDATE ON centre_partenaire
FOR EACH ROW WHEN NEW.modifie_le = OLD.modifie_le
BEGIN
    UPDATE centre_partenaire SET modifie_le = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

COMMIT;
