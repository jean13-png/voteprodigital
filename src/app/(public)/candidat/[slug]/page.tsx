import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getCandidateBySlug,
  getCandidatesRanked,
  DOMAINES,
  VOTE_OBJECTIF,
  VOTE_PRICE,
} from "@/lib/db-queries";
import DomaineBadge from "@/components/ui/DomaineBadge";
import ShareButton from "./ShareButton";
import { ArrowRight, Trophy, Target, Vote, Play, ChevronLeft } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const candidat = await getCandidateBySlug(slug);
  if (!candidat) return {};

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://voteprodigital.vercel.app";
  const title = `${candidat.nom} — Votez pour moi ! 🗳️`;
  const description = `Soutenez ${candidat.nom} en ${DOMAINES[candidat.domaine]} au Bootcamp Digital Academy 2026. ${Number(candidat.totalVotes)} votes reçus. Chaque vote compte !`;
  // On utilise la photo du candidat si disponible, sinon le logo de la plateforme
  const image = candidat.photo ?? `${BASE_URL}/images/logo.jpeg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/candidat/${slug}`,
      siteName: "ProDigital Center",
      type: "profile",
      locale: "fr_FR",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${candidat.nom} — Bootcamp Digital Academy 2026`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export default async function CandidatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [candidat, allCandidats] = await Promise.all([
    getCandidateBySlug(slug),
    getCandidatesRanked(),
  ]);

  if (!candidat) notFound();

  const rank = allCandidats.findIndex((c) => c.id === candidat.id) + 1;
  const progress = Math.min(
    (Number(candidat.totalVotes) / VOTE_OBJECTIF) * 100,
    100
  );
  const youtubeId = getYouTubeId(candidat.videoUrl);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-0">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/candidats" className="hover:text-[#1B2A6B] flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Candidats
          </Link>
          <span>/</span>
          <span className="text-[#1B2A6B] font-medium truncate">{candidat.nom}</span>
        </div>
      </div>

      {/* ── HERO MOBILE : photo plein écran + infos superposées ── */}
      <div className="lg:hidden">
        {/* Photo */}
        <div className="relative w-full aspect-[4/3] bg-gray-200">
          {candidat.photo ? (
            <Image
              src={candidat.photo}
              alt={candidat.nom}
              fill
              className="object-cover object-top"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/10">
              <span className="text-7xl font-bold text-[#1B2A6B]/20">
                {candidat.nom.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Rang en badge sur la photo */}
          <div className="absolute top-3 left-3 bg-[#1B2A6B] text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-[#F5A623]" />
            #{rank} au classement
          </div>
        </div>

        {/* Infos rapides sous la photo */}
        <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
          <DomaineBadge domaine={candidat.domaine} />
          <h1 className="text-xl font-extrabold text-[#1B2A6B] mt-2 mb-1">
            {candidat.nom}
          </h1>
          {candidat.bio && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
              {candidat.bio}
            </p>
          )}
        </div>

        {/* Compteur votes */}
        <div className="bg-white mx-4 mt-4 rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1B2A6B]">
              <Vote className="w-4 h-4" />
              {Number(candidat.totalVotes).toLocaleString("fr-FR")} votes
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              Objectif {VOTE_OBJECTIF.toLocaleString("fr-FR")}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F5A623] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-[#F5A623] font-semibold mt-1">
            {progress.toFixed(1)}%
          </p>
        </div>

        {/* Vidéo teaser */}
        {candidat.videoUrl && youtubeId && (
          <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <Play className="w-4 h-4 text-[#F5A623]" />
              <span className="text-sm font-semibold text-[#1B2A6B]">Vidéo de présentation</span>
            </div>
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Présentation de ${candidat.nom}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Partager */}
        <div className="mx-4 mt-4">
          <ShareButton nom={candidat.nom} slug={candidat.slug} />
        </div>
      </div>

      {/* ── LAYOUT DESKTOP ── */}
      <div className="hidden lg:block max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-8">
          {/* Colonne gauche */}
          <div className="col-span-1 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="relative aspect-[3/4] bg-gray-100">
                {candidat.photo ? (
                  <Image
                    src={candidat.photo}
                    alt={candidat.nom}
                    fill
                    className="object-cover"
                    sizes="33vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/5">
                    <span className="text-6xl font-bold text-[#1B2A6B]/20">
                      {candidat.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#F5A623]" />
                <span className="text-sm font-semibold text-[#1B2A6B]">Classement</span>
              </div>
              <p className="text-4xl font-extrabold text-[#1B2A6B]">
                #{rank}
                <span className="text-base font-normal text-gray-400 ml-1">
                  / {allCandidats.length}
                </span>
              </p>
            </div>

            <ShareButton nom={candidat.nom} slug={candidat.slug} />
          </div>

          {/* Colonne droite */}
          <div className="col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <DomaineBadge domaine={candidat.domaine} />
              <h1 className="text-3xl font-extrabold text-[#1B2A6B] mt-3 mb-2">
                {candidat.nom}
              </h1>
              {candidat.bio && (
                <p className="text-gray-600 text-sm leading-relaxed">{candidat.bio}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Vote className="w-5 h-5 text-[#1B2A6B]" />
                  <span className="font-semibold text-[#1B2A6B]">Votes reçus</span>
                </div>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Objectif : {VOTE_OBJECTIF.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-extrabold text-[#1B2A6B]">
                  {Number(candidat.totalVotes).toLocaleString("fr-FR")}
                </span>
                <span className="text-gray-400 text-sm mb-1.5">votes validés</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#F5A623] rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span className="font-semibold text-[#F5A623]">
                  {progress.toFixed(1)}% de l&apos;objectif
                </span>
                <span>{VOTE_OBJECTIF.toLocaleString("fr-FR")}</span>
              </div>
            </div>

            {candidat.videoUrl && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-[#F5A623]" />
                  <span className="font-semibold text-[#1B2A6B]">Vidéo de présentation</span>
                </div>
                {youtubeId ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={`Présentation de ${candidat.nom}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full absolute inset-0"
                    />
                  </div>
                ) : (
                  <a
                    href={candidat.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#1B2A6B] hover:text-[#F5A623] font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" /> Voir la vidéo
                  </a>
                )}
              </div>
            )}

            <div className="bg-[#1B2A6B] rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-1">
                Soutenez {candidat.nom.split(" ")[0]}
              </h2>
              <p className="text-white/70 text-sm mb-5">
                1 vote = {VOTE_PRICE} FCFA. Vous pouvez voter autant de fois que vous le souhaitez.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/candidat/${candidat.slug}/projet`}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#1B2A6B] font-bold px-5 py-3 transition-colors"
                >
                  Voir le projet
                </Link>
                <Link
                  href={`/voter/${candidat.slug}`}
                  className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#e09516] text-white font-bold px-6 py-3 transition-colors"
                >
                  Voter maintenant
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOUTON VOTER FIXE EN BAS SUR MOBILE ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">
            Voter pour <strong className="text-[#1B2A6B]">{candidat.nom.split(" ")[0]}</strong>
          </p>
          <p className="text-xs font-semibold text-[#F5A623]">
            1 vote = {VOTE_PRICE} FCFA
          </p>
        </div>
        <Link
          href={`/voter/${candidat.slug}`}
          className="shrink-0 bg-[#F5A623] hover:bg-[#e09516] text-white font-bold px-6 py-3 text-sm transition-colors flex items-center gap-2"
        >
          Voter
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
