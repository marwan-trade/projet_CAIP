-- =====================================================================
-- CAIP — Requêtes du tableau de bord du candidat
-- :candidat = identifiant de l'utilisateur connecté
-- Chaque requête correspond à un bloc de la page.
-- =====================================================================

-- 1. En-tête « Bonjour, … » ----------------------------------------------
SELECT nom_complet
FROM utilisateur
WHERE id = :candidat AND role = 'candidat';

-- 2. Parcours en 5 portes -------------------------------------------------
-- fait = la porte est franchie. Règle provisoire pour « Entretien » : le
-- module 3 « Se présenter en entretien » est validé (à revoir quand la page
-- Entretiens sera conçue).
SELECT
    EXISTS (SELECT 1 FROM document WHERE utilisateur_id = :candidat AND type = 'cv')     AS cv_fait,
    EXISTS (SELECT 1 FROM document WHERE utilisateur_id = :candidat AND type = 'lettre') AS lettre_faite,
    EXISTS (SELECT 1 FROM analyse  WHERE utilisateur_id = :candidat)                     AS analyse_faite,
    EXISTS (SELECT 1 FROM progression_module p JOIN module_formation m ON m.id = p.module_id
            WHERE p.utilisateur_id = :candidat AND m.numero = 3 AND p.statut = 'valide') AS entretien_fait,
    (SELECT count(*) FROM progression_module WHERE utilisateur_id = :candidat AND statut = 'valide')
        = (SELECT count(*) FROM module_formation)                                        AS formation_faite;

-- 3. Prochaine action : recommandations « haute » non corrigées -----------
--    de la dernière analyse
SELECT count(*) AS recommandations_prioritaires, a.cree_le AS derniere_analyse_le
FROM analyse a
LEFT JOIN recommandation r
       ON r.analyse_id = a.id AND r.priorite = 'haute' AND r.corrigee_le IS NULL
WHERE a.id = (SELECT id FROM analyse WHERE utilisateur_id = :candidat ORDER BY cree_le DESC, id DESC LIMIT 1)
GROUP BY a.id;

-- 4. Historique des analyses (et carte « Score de mon CV ») ---------------
--    version : 1 pour la première analyse, 2 pour la suivante…
SELECT
    a.id,
    a.cree_le,
    CASE WHEN a.lettre_id IS NULL THEN 'CV' ELSE 'CV + lettre' END AS documents,
    (SELECT count(*) FROM analyse b
      WHERE b.utilisateur_id = a.utilisateur_id
        AND (b.cree_le < a.cree_le OR (b.cree_le = a.cree_le AND b.id <= a.id))) AS version,
    a.poste_vise,
    a.score
FROM analyse a
WHERE a.utilisateur_id = :candidat
ORDER BY a.cree_le DESC, a.id DESC;

-- 5. Formation : modules validés, module à reprendre ----------------------
SELECT
    m.numero,
    m.titre,
    COALESCE(p.statut, 'a_venir') AS statut
FROM module_formation m
LEFT JOIN progression_module p
       ON p.module_id = m.id AND p.utilisateur_id = :candidat
ORDER BY m.numero;

-- 6. Accompagnement : dernière demande, conseiller et statut --------------
SELECT d.statut, c.nom_complet AS conseiller, c.specialite
FROM demande_accompagnement d
LEFT JOIN utilisateur c ON c.id = d.conseiller_id
WHERE d.candidat_id = :candidat
ORDER BY d.cree_le DESC, d.id DESC
LIMIT 1;
