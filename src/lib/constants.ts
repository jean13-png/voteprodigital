// Constantes partagées entre client et serveur
// Ce fichier ne doit JAMAIS importer db/index.ts

export const VOTE_PRICE = 50; // FCFA par vote
export const VOTE_OBJECTIF = 1000; // objectif par candidat
export const SOUTENANCE_DATE = new Date("2026-11-07T08:00:00");

export const DOMAINES: Record<string, string> = {
  bureautique: "Bureautique & Informatique",
  graphisme: "Graphisme",
  developpement_web: "Développement Web",
  ecommerce: "E-Commerce",
  audiovisuel: "Audiovisuel",
  tout: "Tout",
};

function formatSoutenanceDate(date: Date): string {
  const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
}

export const SOUTENANCE_DATE_FORMATTED = formatSoutenanceDate(SOUTENANCE_DATE);
