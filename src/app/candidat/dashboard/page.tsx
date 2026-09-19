import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCandidateVoteStats, getVotesByCandidate, getCandidateById } from "@/lib/db-queries";
import Link from "next/link";
import Image from "next/image";
import { Vote, Clock, User, LogOut, Share2, Trophy } from "lucide-react";
import DomaineBadge from "@/components/ui/DomaineBadge";
import CandidatLogoutButton from "./CandidatLogoutButton";

export const dynamic = "force-dynamic";

const statutBadge: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-700",
  valide: "bg-green-100 text-green-700",
  refuse: "bg-red-100 text-red-700",
};
const statutLabel: Record<string, string> = {
  en_attente: "En attente",
  valide: "Validé",
  refuse: "Refusé",
};

export default async function CandidatDashboardPage() {
  const session = await auth();
  if (!session || session.user?.role !== "candidate") redirect("/candidat/login");

  const candidatId = parseInt(session.user.id);
  const [candidat, stats, historique] = await Promise.all([
    getCandidateById(candidatId),
    getCandidateVoteStats(candidatId),
    getVotesByCandidate(candidatId, 20),
  ]);

  if (!candidat) redirect("/candidat/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1B2A6B] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#F5A623]" />
            </div>
            <span className="font-bold text-sm">Espace Candidat</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/candidat/profil"
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Mon profil
            </Link>
            <CandidatLogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profil card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {candidat.photo ? (
              <Image src={candidat.photo} alt={candidat.nom} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/10">
                <span className="text-xl font-bold text-[#1B2A6B]/40">{candidat.nom.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-[#1B2A6B] truncate">{candidat.nom}</h1>
            <DomaineBadge domaine={candidat.domaine} />
          </div>
          <Link
            href={`/candidat/${candidat.slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B2A6B] border border-[#1B2A6B]/20 px-3 py-1.5 rounded-lg hover:bg-[#1B2A6B]/5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Ma page
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Votes validés</span>
            </div>
            <p className="text-3xl font-extrabold text-[#1B2A6B]">
              {Number(stats?.totalVotes ?? 0).toLocaleString("fr-FR")}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500">En attente</span>
            </div>
            <p className="text-3xl font-extrabold text-[#1B2A6B]">
              {Number(stats?.votesEnAttente ?? 0).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        {/* Lien partage mobile */}
        <Link
          href={`/candidat/${candidat.slug}`}
          target="_blank"
          className="sm:hidden flex items-center justify-center gap-2 bg-[#F5A623] text-white font-semibold py-3 rounded-xl"
        >
          <Share2 className="w-4 h-4" /> Partager ma page de vote
        </Link>

        {/* Historique votants */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1B2A6B]">Historique des votes reçus</h2>
            <p className="text-xs text-gray-400 mt-0.5">20 dernières transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Votant</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Montant</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historique.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Aucun vote reçu pour le moment.
                    </td>
                  </tr>
                ) : (
                  historique.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{v.nomVotant}</p>
                        <p className="text-xs text-gray-400">{v.telephone}</p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#1B2A6B]">{v.nombreVotes}</td>
                      <td className="px-5 py-3.5 text-gray-600 hidden sm:table-cell">
                        {v.montant.toLocaleString("fr-FR")} F
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statutBadge[v.statut] ?? "bg-gray-100 text-gray-600"}`}>
                          {statutLabel[v.statut] ?? v.statut}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">
                        {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
