// Couche d'accès aux données.
// Aujourd'hui : données d'exemple avec un léger délai pour simuler le réseau.
// Demain : remplacer chaque fonction par un fetch vers l'API Express,
// par exemple `return request('/api/analyses')`. Les pages n'ont pas à changer.

import * as mock from '../data/mock.js';

const DELAI = 250;

function simuler(data) {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), DELAI));
}

export const API_URL = import.meta.env?.VITE_API_URL ?? '';

export async function request(path, options = {}) {
  const res = await fetch(API_URL + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export const api = {
  tableauDeBord: () =>
    simuler({
      candidat: mock.candidat,
      parcours: mock.parcours,
      analyses: mock.analyses,
      modules: mock.modules,
      accompagnement: mock.accompagnement,
      // Recommandations « Haute » pas encore corrigées dans la dernière analyse.
      recommandationsPrioritaires: mock.rapport.recommandations.filter((r) => r.priorite === 'Haute').length,
    }),
  rapport: () => simuler(mock.rapport),
  analyses: () => simuler(mock.analyses),
  modeles: () => simuler({ modeles: mock.modeles, secteurs: mock.secteurs }),
  entretiens: () => simuler(mock.themesEntretien),
  formation: () => simuler({ modules: mock.modules, quiz: mock.quiz }),
  accompagnement: () => simuler(mock.accompagnement),
  profil: () => simuler({ candidat: mock.candidat, documents: mock.mesDocuments }),
  demandesConseiller: () => simuler(mock.demandesConseiller),
  indicateurs: () => simuler(mock.indicateurs),
};
