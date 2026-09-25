import { db, candidates, votes } from "@/db";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Plus, PencilLine, FolderKanban, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProjetsPage() {
  const rows = await db
    .select({
      id: candidates.id,
      nom: candidates.nom,
      slug: candidates.slug,
      photo: candidates.photo,
      projectTitle: candidates.projectTitle,
      projectDescription: candidates.projectDescription,
      projectVideoUrl: candidates.projectVideoUrl,
      projectImage: candidates.projectImage,
      projectLinks: candidates.projectLinks,
      actif: candidates.actif,
      totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`,
    })
    .from(candidates)
    .leftJoin(votes, eq(votes.candidateId, candidates.id))
    .groupBy(candidates.id)
    .orderBy(candidates.nom);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-2">
            Gestion des projets
          </p>
          <h1 className="text-2xl font-extrabold text-[#1B2A6B]">Projets des candidats</h1>
        </div>

        <Link
          href="/admin/candidats/nouveau"
          className="inline-flex items-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un candidat
        </Link>
      </div>

      <div className="grid gap-4">
        {rows.map((candidat) => {
          const hasProject = Boolean(
            candidat.projectTitle ||
            candidat.projectDescription ||
            candidat.projectVideoUrl ||
            candidat.projectImage ||
            candidat.projectLinks
          );

          return (
            <div
              key={candidat.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {candidat.photo ? (
                      <Image
                        src={candidat.photo}
                        alt={candidat.nom}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/10 text-[#1B2A6B] font-bold">
                        {candidat.nom.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-[#1B2A6B]">{candidat.nom}</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5A623]/10 text-[#8a5f00] text-[10px] font-semibold uppercase tracking-wider px-2 py-1">
                        <FolderKanban className="w-3 h-3" />
                        {hasProject ? "Projet configuré" : "Projet vide"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      {candidat.projectTitle || "Aucun titre de projet pour le moment"}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>{Number(candidat.totalVotes).toLocaleString("fr-FR")} votes</span>
                      {candidat.projectVideoUrl && <span>Vidéo YouTube</span>}
                      {candidat.projectImage && <span>Image projet</span>}
                      {candidat.projectLinks && <span>Liens ajoutés</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/candidat/${candidat.slug}/projet`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#1B2A6B] hover:text-[#1B2A6B] transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le projet
                  </Link>

                  <Link
                    href={`/admin/candidats/${candidat.id}`}
                    className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e09516] text-[#1B2A6B] font-semibold text-sm px-3 py-2 rounded-lg transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                    {hasProject ? "Modifier le projet" : "Ajouter un projet"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
