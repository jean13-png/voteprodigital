import { db, candidates, votes } from "@/db";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trophy } from "lucide-react";
import DomaineBadge from "@/components/ui/DomaineBadge";
import DeleteCandidatButton from "./DeleteCandidatButton";
import ToggleActifButton from "./ToggleActifButton";

export const dynamic = "force-dynamic";

export default async function AdminCandidatsPage() {
  const rows = await db
    .select({
      id: candidates.id,
      slug: candidates.slug,
      nom: candidates.nom,
      email: candidates.email,
      photo: candidates.photo,
      domaine: candidates.domaine,
      actif: candidates.actif,
      totalVotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0)`,
    })
    .from(candidates)
    .leftJoin(votes, eq(votes.candidateId, candidates.id))
    .groupBy(candidates.id)
    .orderBy(sql`COALESCE(SUM(CASE WHEN ${votes.statut} = 'valide' THEN ${votes.nombreVotes} ELSE 0 END), 0) DESC`);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B2A6B]">Candidats</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length} candidat{rows.length > 1 ? "s" : ""} enregistré{rows.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/candidats/nouveau"
          className="inline-flex items-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau candidat
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Candidat
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Domaine
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Votes
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((c, index) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {c.photo ? (
                          <Image
                            src={c.photo}
                            alt={c.nom}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/10">
                            <span className="text-sm font-bold text-[#1B2A6B]/40">
                              {c.nom.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{c.nom}</p>
                        <p className="text-xs text-gray-400">#{index + 1} au classement</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <DomaineBadge domaine={c.domaine} />
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#1B2A6B]">
                    {Number(c.totalVotes).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5">
                    <ToggleActifButton id={c.id} actif={c.actif} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/candidats/${c.id}`}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#1B2A6B] hover:text-white text-gray-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <DeleteCandidatButton id={c.id} nom={c.nom} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
