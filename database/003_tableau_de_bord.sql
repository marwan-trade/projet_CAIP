-- =====================================================================
-- CAIP — Migration 003 : tableau de bord du candidat
-- Page concernée : Tableau de bord (espace candidat)
-- SQL simple, testé avec SQLite 3.35 ou plus récent.
-- Prérequis : 001_comptes.sql
--
-- Le tableau de bord affiche :
--   - le parcours en 5 portes (CV, lettre, analyse, entretien, formation)
--   - la prochaine action (recommandations prioritaires à corriger)
--   - le score du CV et sa progression d'une version à l'autre
--   - l'avancement de la formation
--   - l'état de la demande d'accompagnement et le conseiller
--   - l'historique des analyses
-- Seules les colonnes qu'il lit sont créées ici ; les pages Dépôt, Rapport,
-- Formation et Accompagnement ajouteront les leurs.
-- =====================================================================

PRAGMA foreign_keys = ON;

BEGIN;

-- ---------------------------------------------------------------------
-- Conseiller : sa spécialité s'affiche sous son nom (« Conseiller · … »)
-- ---------------------------------------------------------------------
ALTER TABLE utilisateur ADD COLUMN specialite VARCHAR(120);

-- ---------------------------------------------------------------------
-- document : CV et lettres déposés par le candidat
-- Portes « CV » et « Lettre » ; colonne « Document » de l'historique.
-- ---------------------------------------------------------------------
CREATE TABLE document (
    id              INTEGER      PRIMARY KEY AUTOINCREMENT,
    utilisateur_id  INTEGER      NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    type            VARCHAR(10)  NOT NULL CHECK (type IN ('cv', 'lettre')),
    nom_fichier     VARCHAR(255) NOT NULL CHECK (length(trim(nom_fichier)) > 0),
    depose_le       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX document_par_utilisateur ON document (utilisateur_id, type);

-- ---------------------------------------------------------------------
-- analyse : une candidature soumise et son score
-- Porte « Analyse », carte « Score de mon CV », historique.
-- Le numéro de version (v1, v2…) se déduit de l'ordre des analyses.
-- ---------------------------------------------------------------------
CREATE TABLE analyse (
    id              INTEGER      PRIMARY KEY AUTOINCREMENT,
    utilisateur_id  INTEGER      NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    cv_id           INTEGER      NOT NULL REFERENCES document (id),
    lettre_id       INTEGER      REFERENCES document (id),
    poste_vise      VARCHAR(150) NOT NULL CHECK (length(trim(poste_vise)) > 0),
    score           SMALLINT     NOT NULL CHECK (score BETWEEN 0 AND 100),
    cree_le         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX analyse_par_utilisateur ON analyse (utilisateur_id, cree_le);

-- ---------------------------------------------------------------------
-- recommandation : ce que l'analyse conseille de corriger
-- Carte « Prochaine action » : nombre de recommandations « haute »
-- pas encore corrigées dans la dernière analyse.
-- (La page Rapport ajoutera la section, le titre et le détail.)
-- ---------------------------------------------------------------------
CREATE TABLE recommandation (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    analyse_id  INTEGER     NOT NULL REFERENCES analyse (id) ON DELETE CASCADE,
    priorite    VARCHAR(10) NOT NULL CHECK (priorite IN ('haute', 'moyenne', 'basse')),
    corrigee_le TIMESTAMP
);

CREATE INDEX recommandation_par_analyse ON recommandation (analyse_id, priorite);

-- ---------------------------------------------------------------------
-- module_formation : les modules de la formation (6 au départ)
-- progression_module : où en est chaque candidat
-- Carte « Formation » (x modules sur 6, module à reprendre) et porte
-- « Formation ». Un module sans ligne de progression est « à venir ».
-- ---------------------------------------------------------------------
CREATE TABLE module_formation (
    id      INTEGER      PRIMARY KEY AUTOINCREMENT,
    numero  SMALLINT     NOT NULL UNIQUE CHECK (numero > 0),
    titre   VARCHAR(150) NOT NULL CHECK (length(trim(titre)) > 0)
);

CREATE TABLE progression_module (
    utilisateur_id  INTEGER     NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    module_id       INTEGER     NOT NULL REFERENCES module_formation (id) ON DELETE CASCADE,
    statut          VARCHAR(10) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'valide')),
    valide_le       TIMESTAMP,
    PRIMARY KEY (utilisateur_id, module_id),
    CHECK ((statut = 'valide') = (valide_le IS NOT NULL))
);

-- ---------------------------------------------------------------------
-- demande_accompagnement : la demande d'aide à un conseiller
-- Carte « Accompagnement » : conseiller assigné et statut.
-- (La page Accompagnement ajoutera l'objectif, les disponibilités…)
-- ---------------------------------------------------------------------
CREATE TABLE demande_accompagnement (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    candidat_id     INTEGER     NOT NULL REFERENCES utilisateur (id) ON DELETE CASCADE,
    -- Un conseiller qui a des demandes ne peut pas être supprimé :
    -- l'administrateur les réassigne d'abord, ou désactive son compte.
    conseiller_id   INTEGER     REFERENCES utilisateur (id) ON DELETE RESTRICT,
    statut          VARCHAR(10) NOT NULL DEFAULT 'recue'
                    CHECK (statut IN ('recue', 'assignee', 'en_cours', 'cloturee')),
    cree_le         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifie_le      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Une demande assignée, en cours ou clôturée a forcément un conseiller.
    CHECK (statut = 'recue' OR conseiller_id IS NOT NULL)
);

CREATE INDEX demande_par_candidat ON demande_accompagnement (candidat_id, cree_le);
CREATE INDEX demande_par_conseiller ON demande_accompagnement (conseiller_id, statut);

-- Le candidat doit avoir le rôle « candidat », le conseiller le rôle « conseiller ».
CREATE TRIGGER demande_roles_insert
BEFORE INSERT ON demande_accompagnement
FOR EACH ROW
WHEN (SELECT role FROM utilisateur WHERE id = NEW.candidat_id) IS NOT 'candidat'
  OR (NEW.conseiller_id IS NOT NULL AND (SELECT role FROM utilisateur WHERE id = NEW.conseiller_id) IS NOT 'conseiller')
BEGIN
    SELECT RAISE(ABORT, 'demande_accompagnement : candidat ou conseiller invalide');
END;

CREATE TRIGGER demande_roles_update
BEFORE UPDATE OF candidat_id, conseiller_id ON demande_accompagnement
FOR EACH ROW
WHEN (SELECT role FROM utilisateur WHERE id = NEW.candidat_id) IS NOT 'candidat'
  OR (NEW.conseiller_id IS NOT NULL AND (SELECT role FROM utilisateur WHERE id = NEW.conseiller_id) IS NOT 'conseiller')
BEGIN
    SELECT RAISE(ABORT, 'demande_accompagnement : candidat ou conseiller invalide');
END;

CREATE TRIGGER demande_modifie_le
AFTER UPDATE ON demande_accompagnement
FOR EACH ROW WHEN NEW.modifie_le = OLD.modifie_le
BEGIN
    UPDATE demande_accompagnement SET modifie_le = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ---------------------------------------------------------------------
-- Les 6 modules de la formation (titres repris des maquettes)
-- ---------------------------------------------------------------------
INSERT INTO module_formation (numero, titre) VALUES
    (1, 'Construire son projet professionnel'),
    (2, 'Rédiger un CV efficace'),
    (3, 'Se présenter en entretien'),
    (4, 'Répondre aux questions difficiles'),
    (5, 'Négocier et conclure'),
    (6, 'Après l''entretien');

COMMIT;
