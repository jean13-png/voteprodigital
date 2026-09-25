import { getAdminStats, getDerniersVotes } from "@/lib/db-queries";
import { Vote, Clock, CheckCircle, Users, Banknote, ArrowRight, FileText, Send } from "lucide-react";
import Link from "next/link";
import { generateCandidateCredentials } from "@/lib/actions/student-credentials";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-[#1B2A6B]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

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

export default async function AdminDashboard() {
  const [stats, derniers] = await Promise.all([
    getAdminStats(),
    getDerniersVotes(10),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 rounded-2xl border border-[#1B2A6B]/10 bg-[#1B2A6B] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-2">
              Gestion des accès
            </p>
            <h2 className="text-xl font-bold">Générer le PDF des identifiants candidats</h2>
            <p className="mt-1 text-sm text-slate-200">
              Génére un document PDF contenant les identifiants de connexion de chaque candidat ayant un email, avec possibilité d’enregistrer un mot de passe unique pour chaque compte.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/admin/identifiants"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2A6B] transition hover:bg-slate-100"
            >
              <FileText className="h-4 w-4" />
              Voir les identifiants
            </Link>
            <form action={generateCandidateCredentials} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="hidden" name="scope" value="missing" />
              <label className="inline-flex items-center gap-2 text-sm text-slate-100">
                <input type="checkbox" name="includePdf" value="true" className="h-4 w-4 rounded border-slate-300 text-[#F5A623] focus:ring-[#F5A623]" />
                Inclure le PDF
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-[#1B2A6B] transition hover:bg-[#e59a12]"
              >
                <Send className="h-4 w-4" />
                Générer manquants
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Tableau de bord
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Vue d&apos;ensemble de la plateforme de vote ProDigital Center.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total transactions"
          value={stats.totalVotes}
          icon={Vote}
          color="bg-[#1B2A6B]/10 text-[#1B2A6B]"
        />
        <StatCard
          label="En attente"
          value={stats.enAttente}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
          sub="À vérifier"
        />
        <StatCard
          label="Validés"
          value={stats.valides}
          icon={CheckCircle}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Candidats"
          value={stats.candidats}
          icon={Users}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Montant validé"
          value={`${stats.montantTotal.toLocaleString("fr-FR")} F`}
          icon={Banknote}
          color="bg-[#F5A623]/10 text-[#F5A623]"
          sub="FCFA"
        />
      </div>

      {/* Derniers votes */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1B2A6B]">Dernières transactions</h2>
          <Link
            href="/admin/votes"
            className="text-xs font-semibold text-[#1B2A6B] hover:text-[#F5A623] flex items-center gap-1 transition-colors"
          >
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Votant
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Candidat
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Montant
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {derniers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    Aucune transaction pour le moment.
                  </td>
                </tr>
              ) : (
                derniers.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">
                        {v.nomVotant}
                      </p>
                      <p className="text-xs text-gray-400">{v.telephone}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-gray-600">
                      {v.candidatNom}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#1B2A6B]">
                      {v.nombreVotes}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-600">
                      {v.montant.toLocaleString("fr-FR")} F
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statutBadge[v.statut] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {statutLabel[v.statut] ?? v.statut}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
