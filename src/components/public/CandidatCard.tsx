import Link from "next/link";
import Image from "next/image";
import { Vote, Trophy } from "lucide-react";
import DomaineBadge from "@/components/ui/DomaineBadge";
import { VOTE_OBJECTIF } from "@/lib/constants";

interface CandidatCardProps {
  rank: number;
  slug: string;
  nom: string;
  photo?: string | null;
  photoAffiche?: string | null;
  domaine: string;
  totalVotes: number;
}

const rankColors: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 text-gray-700",
  3: "bg-amber-600 text-amber-100",
};

const rankLabels: Record<number, string> = {
  1: "1er",
  2: "2e",
  3: "3e",
};

export default function CandidatCard({
  rank,
  slug,
  nom,
  photo,
  photoAffiche,
  domaine,
  totalVotes,
}: CandidatCardProps) {
  const progress = Math.min((totalVotes / VOTE_OBJECTIF) * 100, 100);
  const displayPhoto = photoAffiche || photo;
  const rankBadgeClass =
    rankColors[rank] ?? "bg-[#1B2A6B]/10 text-[#1B2A6B]";

  return (
    <Link href={`/candidat/${slug}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
        {/* Photo */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {displayPhoto ? (
            <Image
              src={displayPhoto}
              alt={nom}
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/5">
              <span className="text-4xl font-bold text-[#1B2A6B]/20">
                {nom.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Rang - 1er, 2e, 3e seulement */}
          {rank <= 3 && (
            <div
              className={`absolute ${rank === 1 ? "top-3 right-3" : "top-3 left-3"} ${rank === 1 ? "px-2.5 py-2" : "px-2 py-1"} rounded-full flex items-center justify-center text-xs font-bold ${rankBadgeClass}`}
            >
              {rank === 1 ? (
                <Trophy className="w-4 h-4" />
              ) : (
                rankLabels[rank]
              )}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-4">
          <h3 className="font-bold text-[#1B2A6B] text-base mb-1 line-clamp-1">
            {nom}
          </h3>
          <DomaineBadge domaine={domaine} />

          {/* Compteur votes */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <Vote className="w-3.5 h-3.5" />
                {totalVotes.toLocaleString("fr-FR")} votes
              </span>
              <span className="font-medium text-[#1B2A6B]">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F5A623] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Bouton projet */}
          <div className="mt-3 flex gap-2">
            <Link
              href={`/candidat/${slug}/projet`}
              className="flex-1 bg-[#1B2A6B] hover:bg-[#162058] text-white text-sm font-semibold py-2 rounded-lg transition-colors text-center"
            >
              Voir le projet
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
}
