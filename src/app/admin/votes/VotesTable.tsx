"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, CheckCircle, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { swalConfirm, swalToast, swalError } from "@/lib/swal";

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

const filters = [
  { key: "all", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
];

interface VoteRow {
  id: number;
  nomVotant: string;
  telephone: string;
  nombreVotes: number;
  montant: number;
  statut: string;
  preuve: string | null;
  commentaireAdmin: string | null;
  createdAt: Date;
  candidatNom: string;
  candidatSlug: string;
}

interface Props {
  data: {
    votes: VoteRow[];
    total: number;
    page: number;
    totalPages: number;
  };
  currentStatut: string;
  currentSearch: string;
}

export default function VotesTable({ data, currentStatut, currentSearch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams();
    Object.entries({ statut: currentStatut, search, ...params }).forEach(
      ([k, v]) => { if (v && v !== "all" && v !== "") sp.set(k, v); }
    );
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search, page: "1" });
  }

  async function handleAction(vote: VoteRow, action: "valider" | "refuser") {
    const isValider = action === "valider";

    const result = await swalConfirm(
      isValider ? "Valider ce vote ?" : "Refuser ce vote ?",
      isValider
        ? `${vote.nombreVotes} vote(s) seront crédités à ${vote.candidatNom}.`
        : `Le vote de ${vote.nomVotant} sera refusé.`,
      isValider ? "Valider" : "Refuser"
    );
    if (!result.isConfirmed) return;

    setLoadingId(vote.id);
    const res = await fetch(`/api/admin/votes/${vote.id}/${action}`, { method: "PATCH" });
    setLoadingId(null);

    if (!res.ok) {
      await swalError("Erreur", "L'action a échoué. Réessayez.");
      return;
    }

    swalToast(
      isValider ? "success" : "info",
      isValider
        ? `Vote validé — ${vote.nombreVotes} vote(s) crédités à ${vote.candidatNom}`
        : `Vote de ${vote.nomVotant} refusé.`
    );
    router.refresh();
  }

  return (
    <>
      {/* Filtres + recherche */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => navigate({ statut: f.key, page: "1" })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                currentStatut === f.key
                  ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
                  : "border-gray-200 text-gray-600 hover:border-[#1B2A6B]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] w-44"
            />
          </div>
          <button type="submit" className="bg-[#1B2A6B] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            OK
          </button>
        </form>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-500">
          {data.total} résultat{data.total > 1 ? "s" : ""}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Votant", "Candidat", "Votes", "Montant", "Preuve", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.votes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Aucun vote trouvé.
                  </td>
                </tr>
              ) : (
                data.votes.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">{v.nomVotant}</p>
                      <p className="text-xs text-gray-400">{v.telephone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{v.candidatNom}</td>
                    <td className="px-4 py-3 font-bold text-[#1B2A6B]">{v.nombreVotes}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {v.montant.toLocaleString("fr-FR")} F
                    </td>
                    <td className="px-4 py-3">
                      {v.preuve ? (
                        <button
                          onClick={() => setPreviewUrl(v.preuve)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#1B2A6B] hover:text-[#F5A623] transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Voir
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">Aucune</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statutBadge[v.statut] ?? "bg-gray-100 text-gray-600"}`}>
                        {statutLabel[v.statut] ?? v.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.statut === "en_attente" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAction(v, "valider")}
                            disabled={loadingId === v.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingId === v.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle className="w-3 h-3" />}
                            Valider
                          </button>
                          <button
                            onClick={() => handleAction(v, "refuser")}
                            disabled={loadingId === v.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-3 h-3" />
                            Refuser
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Page {data.page} / {data.totalPages}</span>
            <div className="flex gap-2">
              {data.page > 1 && (
                <button onClick={() => navigate({ page: String(data.page - 1) })} className="px-3 py-1 border border-gray-200 rounded-lg hover:border-[#1B2A6B] transition-colors">
                  Précédent
                </button>
              )}
              {data.page < data.totalPages && (
                <button onClick={() => navigate({ page: String(data.page + 1) })} className="px-3 py-1 border border-gray-200 rounded-lg hover:border-[#1B2A6B] transition-colors">
                  Suivant
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal preuve */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preuve de paiement" className="w-full rounded-2xl" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
