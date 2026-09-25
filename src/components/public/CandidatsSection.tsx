"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, X, LayoutGrid } from "lucide-react";
import CandidatCard from "@/components/public/CandidatCard";

interface Candidat {
  id: number;
  slug: string;
  nom: string;
  photo?: string | null;
  photoAffiche?: string | null;
  domaine: string;
  totalVotes: number;
}

interface CandidatsSectionProps {
  initialCandidats: Candidat[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  initialSearch: string;
}

const PAGE_SIZE = 8;

export default function CandidatsSection({
  initialCandidats,
  initialTotal,
  initialTotalPages,
  initialPage,
  initialSearch,
}: CandidatsSectionProps) {
  const [candidats, setCandidats] = useState<Candidat[]>(initialCandidats);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [inputValue, setInputValue] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchCandidats = useCallback(async (p: number, q: string, all: boolean) => {
    setLoading(true);
    try {
      const limit = all ? 999 : PAGE_SIZE;
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
        search: q,
      });
      const res = await fetch(`/api/candidats?${params.toString()}`);
      const data = await res.json();
      setCandidats(data.candidats);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      console.error("Erreur chargement candidats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== search) {
        setSearch(inputValue);
        setPage(1);
        fetchCandidats(1, inputValue, showAll);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchCandidats(newPage, search, false);
    setShowAll(false);
    document.getElementById("candidats-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleShowAll() {
    setShowAll(true);
    fetchCandidats(1, search, true);
  }

  function handleShowLess() {
    setShowAll(false);
    fetchCandidats(1, search, false);
    setPage(1);
  }

  function clearSearch() {
    setInputValue("");
    setSearch("");
    setPage(1);
    fetchCandidats(1, "", showAll);
  }

  const startIndex = showAll ? 1 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = showAll ? total : Math.min(page * PAGE_SIZE, total);

  return (
    <div id="candidats-section">
      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Rechercher un candidat..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors"
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-[#1B2A6B] border-t-transparent rounded-full animate-spin" />
              Chargement...
            </span>
          ) : (
            <>
              <span className="font-semibold text-[#1B2A6B]">{total}</span>{" "}
              candidat{total > 1 ? "s" : ""}
              {search && (
                <span className="text-gray-400"> pour &quot;{search}&quot;</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : candidats.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-20 rounded-2xl text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">
            Aucun candidat trouvé pour &quot;{search}&quot;
          </p>
          <button
            onClick={clearSearch}
            className="mt-3 text-sm text-[#1B2A6B] underline underline-offset-4"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {candidats.map((candidat, index) => (
            <CandidatCard
              key={candidat.id}
              rank={showAll ? index + 1 : (page - 1) * PAGE_SIZE + index + 1}
              slug={candidat.slug}
              nom={candidat.nom}
              photo={candidat.photo}
              photoAffiche={candidat.photoAffiche}
              domaine={candidat.domaine}
              totalVotes={Number(candidat.totalVotes)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 order-2 sm:order-1">
            {showAll ? (
              <>Affichage de <span className="font-semibold text-[#1B2A6B]">{total}</span> candidats</>
            ) : (
              <>
                <span className="font-semibold text-[#1B2A6B]">{startIndex}–{endIndex}</span>{" "}
                sur <span className="font-semibold text-[#1B2A6B]">{total}</span> candidats
              </>
            )}
          </p>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            {showAll ? (
              <button
                onClick={handleShowLess}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:border-[#1B2A6B] hover:text-[#1B2A6B] transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Afficher moins
              </button>
            ) : (
              <>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#1B2A6B] hover:text-[#1B2A6B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`dot-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                            page === item
                              ? "bg-[#1B2A6B] text-white"
                              : "border border-gray-200 text-gray-600 hover:border-[#1B2A6B] hover:text-[#1B2A6B]"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#1B2A6B] hover:text-[#1B2A6B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <button
                  onClick={handleShowAll}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1B2A6B] border border-[#1B2A6B]/30 px-4 py-2 rounded-xl hover:bg-[#1B2A6B] hover:text-white transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Voir tous ({total})
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
