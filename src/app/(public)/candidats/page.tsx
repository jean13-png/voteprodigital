import { getCandidatesRanked, DOMAINES } from "@/lib/db-queries";
import CandidatCard from "@/components/public/CandidatCard";
import CandidatsFiltre from "./CandidatsFiltre";
import { Users } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: "Candidats — Bootcamp Digital Academy | ProDigital Center",
  description:
    "Découvrez les 18 candidats du Bootcamp Digital Academy et votez pour votre préféré.",
};

export default async function CandidatsPage({
  searchParams,
}: {
  searchParams: Promise<{ domaine?: string }>;
}) {
  const params = await searchParams;
  const selectedDomaine = params.domaine ?? "tous";
  const allCandidats = await getCandidatesRanked();

  const candidats =
    selectedDomaine === "tous"
      ? allCandidats
      : allCandidats.filter((c) => c.domaine === selectedDomaine);

  return (
    <div className="bg-white min-h-screen">
      {/* En-tête */}
      <div className="bg-[#1B2A6B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <span className="text-xs font-semibold text-[#F5A623] uppercase tracking-widest">
            Bootcamp Digital Academy 2026
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-3">
            Les candidats
          </h1>
          <p className="text-white/70 max-w-xl">
            {allCandidats.length} candidats en compétition dans 5 domaines du
            numérique. Découvrez leurs projets et votez pour les soutenir.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Filtres domaines */}
        <CandidatsFiltre
          domaines={DOMAINES}
          selected={selectedDomaine}
          counts={Object.fromEntries(
            Object.keys(DOMAINES).map((d) => [
              d,
              allCandidats.filter((c) => c.domaine === d).length,
            ])
          )}
          total={allCandidats.length}
        />

        {/* Résultat */}
        <div className="mt-2 mb-6 text-sm text-gray-500">
          {candidats.length === 0
            ? "Aucun candidat trouvé."
            : `${candidats.length} candidat${candidats.length > 1 ? "s" : ""} affiché${candidats.length > 1 ? "s" : ""}`}
        </div>

        {/* Grille */}
        {candidats.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun candidat dans ce domaine.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {candidats.map((candidat, index) => {
              // rang global (basé sur le classement général, pas filtré)
              const globalRank =
                allCandidats.findIndex((c) => c.id === candidat.id) + 1;
              return (
                <CandidatCard
                  key={candidat.id}
                  rank={globalRank}
                  slug={candidat.slug}
                  nom={candidat.nom}
                  photo={candidat.photo}
                  photoAffiche={candidat.photoAffiche}
                  domaine={candidat.domaine}
                  totalVotes={Number(candidat.totalVotes)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
