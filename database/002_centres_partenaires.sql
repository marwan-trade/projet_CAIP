-- =====================================================================
-- CAIP — Migration 002 : centres de formation partenaires
-- Pages concernées : Accueil (section Partenariats),
--                    Connexion (pastilles des partenaires)
-- Prérequis : 001_comptes.sql (fonction maj_modifie_le)
-- =====================================================================

BEGIN;

-- Les centres affichés sur l'accueil et la page de connexion.
-- Ils sont gérés par l'administrateur.
CREATE TABLE centre_partenaire (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom         VARCHAR(150)  NOT NULL,
    logo_url    VARCHAR(500),             -- chemin ou adresse du logo ; vide = pastille par défaut
    site_url    VARCHAR(500),             -- rend le logo cliquable
    ordre       SMALLINT      NOT NULL DEFAULT 0,   -- ordre d'affichage
    visible     BOOLEAN       NOT NULL DEFAULT TRUE,
    cree_le     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    modifie_le  TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT partenaire_nom_non_vide CHECK (length(trim(nom)) > 0),
    CONSTRAINT partenaire_site_http    CHECK (site_url IS NULL OR site_url ~ '^https?://')
);

CREATE UNIQUE INDEX partenaire_nom_unique ON centre_partenaire (lower(nom));
CREATE INDEX partenaire_affichage ON centre_partenaire (ordre) WHERE visible;

CREATE TRIGGER centre_partenaire_modifie_le
    BEFORE UPDATE ON centre_partenaire
    FOR EACH ROW EXECUTE FUNCTION maj_modifie_le();

COMMIT;
