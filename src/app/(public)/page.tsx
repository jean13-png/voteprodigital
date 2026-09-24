import Link from "next/link";
import Image from "next/image";
import { getCandidatesCount, getCandidatesRankedPaginated } from "@/lib/db-queries";
import CandidatsSection from "@/components/public/CandidatsSection";
import Countdown from "@/components/public/Countdown";
import { SOUTENANCE_DATE_FORMATTED } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [candidatCount, initialData] = await Promise.all([
    getCandidatesCount(),
    getCandidatesRankedPaginated({ page: 1, limit: 8, search: "" }),
  ]);

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1B2A6B] overflow-hidden">
        {/* Fond décoratif sobre */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#F5A623] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">

            {/* Texte */}
            <div className="lg:max-w-xl">
              <div className="inline-block border border-[#F5A623]/40 text-[#F5A623] text-xs font-semibold uppercase tracking-widest px-3 py-1 mb-6">
                Bootcamp Digital Academy 2026
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
                Votez pour votre
                <br />
                <span className="text-[#F5A623]">candidat préféré</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                {candidatCount} apprenants du Bootcamp Digital Academy présentent leurs
                projets le <strong className="text-white/90">{SOUTENANCE_DATE_FORMATTED}</strong>.
                Soutenez celui qui mérite votre voix.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-start">
                <Link
                  href="/candidats"
                  className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#e09516] text-white font-semibold px-6 py-3 transition-colors flex items-center justify-center gap-2"
                >
                  Voir les candidats
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#comment-voter"
                  className="w-full sm:w-auto border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 transition-colors text-center"
                >
                  Comment voter ?
                </Link>
              </div>
            </div>

            {/* Bloc countdown */}
            <div className="lg:shrink-0">
              <div className="border border-white/10 bg-white/5 p-6 sm:p-8">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
                  Soutenance dans
                </p>
                <p className="text-white font-bold text-sm mb-5">
                  {SOUTENANCE_DATE_FORMATTED}
                </p>
                <Countdown />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CLASSEMENT ───────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-widest mb-1">
                Classement en direct
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A6B]">
                Top candidats
              </h2>
            </div>
          </div>

          <CandidatsSection
            initialCandidats={initialData.candidats}
            initialTotal={initialData.total}
            initialTotalPages={initialData.totalPages}
            initialPage={initialData.page}
            initialSearch=""
          />

        </div>
      </section>

      {/* ─── COMMENT VOTER ────────────────────────────────────────────────── */}
      <section id="comment-voter" className="bg-gray-50 border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-widest mb-1">
              Mode d&apos;emploi
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A6B]">
              Comment voter ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
            {[
              {
                num: "01",
                title: "Choisissez un candidat",
                desc: `Parcourez les ${candidatCount} candidats et découvrez leurs projets numériques.`,
              },
              {
                num: "02",
                title: "Choisissez le nombre de votes",
                desc: "1 vote = 50 FCFA. Vous pouvez acheter autant de votes que vous voulez.",
              },
              {
                num: "03",
                title: "Payez via Mobile Money",
                desc: "Effectuez le paiement et prenez une capture d'écran comme preuve.",
              },
              {
                num: "04",
                title: "Soumettez le formulaire",
                desc: "Remplissez le formulaire et uploadez votre preuve. C'est tout.",
              },
            ].map((item) => (
              <div key={item.num} className="bg-white p-6 sm:p-8">
                <p className="text-4xl font-extrabold text-[#1B2A6B]/80 mb-4 leading-none opacity-100">
                  {item.num}
                </p>
                <h3 className="text-sm font-bold text-[#1B2A6B] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/candidats"
              className="bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold px-8 py-3 transition-colors flex items-center gap-2"
            >
              Voter maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-sm text-gray-400">
              Votes validés après vérification de la preuve de paiement.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION FINALE ───────────────────────────────────────────────── */}
      <section className="bg-gray-100 border-t border-gray-200 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div className="lg:max-w-xl">
              <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-widest mb-3">
                Un candidat = Une communauté
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A6B] mb-4">
                Chaque vote compte pour votre candidat
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                L&apos;objectif est de 1 000 votes par candidat. En votant,
                vous soutenez leur travail et contribuez à faire connaître
                ProDigital Center et ses formations.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:shrink-0">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-[#F5A623] rounded-full shrink-0" />
                Bootcamp Digital Academy
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-[#F5A623] rounded-full shrink-0" />
                Formations numériques professionnelles
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-[#F5A623] rounded-full shrink-0" />
                Studio Média et services digitaux
              </div>
              <Link
                href="/candidats"
                className="mt-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold px-6 py-3 transition-colors text-sm flex items-center gap-2 w-fit"
              >
                Voir les candidats
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
