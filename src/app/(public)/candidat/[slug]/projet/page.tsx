import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Vote } from "lucide-react";
import { getCandidateBySlug, VOTE_PRICE } from "@/lib/db-queries";
import DomaineBadge from "@/components/ui/DomaineBadge";
import ProjectActions from "./ProjectActions";

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  try {
    const normalized = url.trim();
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "").split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
    }
    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      const candidates = [
        parsed.searchParams.get("v"),
        parsed.pathname.split("/").filter(Boolean)[1] ?? null,
      ];
      const match = candidates.find((candidate) => /^[a-zA-Z0-9_-]{11}$/.test(candidate ?? ""));
      return match ?? null;
    }
  } catch {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    return match?.[1] ?? null;
  }
  return null;
}

function parseProjectLinks(value: string | null): Array<{ label: string; url: string }> {
  if (!value) return [];
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("|");
      if (separatorIndex !== -1) {
        const label = line.slice(0, separatorIndex).trim();
        const url = line.slice(separatorIndex + 1).trim();
        if (label && url) return { label, url };
      }
      const match = line.match(/^(https?:\/\/\S+)$/i);
      if (match) return { label: "Lien du projet", url: match[1] };
      return null;
    })
    .filter((item): item is { label: string; url: string } => Boolean(item));
}

export default async function CandidatProjetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const candidat = await getCandidateBySlug(slug);
  if (!candidat) notFound();
  
  const projectTitle = candidat.projectTitle || "Projet du candidat";
  const projectDescription = candidat.projectDescription || "Le candidat n'a pas encore publié sa présentation de projet.";
  const youtubeId = getYouTubeId(candidat.projectVideoUrl ?? candidat.videoUrl ?? null);
  const projectImage = candidat.projectImage || candidat.projectPosterImage || candidat.photo;
  const projectLinks = parseProjectLinks(candidat.projectLinks);
  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://voteprodigital.vercel.app";
  const projectPageUrl = `${BASE_URL}/candidat/${slug}/projet`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto">
        <Link href={`/candidat/${candidat.slug}`} className="inline-flex items-center gap-2 text-sm text-[#1B2A6B] hover:text-[#F5A623] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au profil
        </Link>
        
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            {/* Contenu principal - Gauche */}
            <div className="p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-3">Projet</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1B2A6B] mb-4">{projectTitle}</h1>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{projectDescription}</p>
              
              {youtubeId ? (
                <div className="mt-6 rounded-2xl overflow-hidden border border-gray-100 bg-black">
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={`Vidéo du projet de ${candidat.nom}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              ) : candidat.projectVideoUrl ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600 mb-2">La vidéo du projet n'est pas une vidéo YouTube intégrable.</p>
                  <a
                    href={candidat.projectVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#1B2A6B] hover:text-[#F5A623]"
                  >
                    Ouvrir la vidéo dans un nouvel onglet
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : null}
            </div>

            {/* Sidebar - Droite : Aperçu candidat + Actions */}
            <div className="hidden lg:flex lg:flex-col bg-[#1B2A6B] p-6 md:p-8 text-white">
              {/* === APERÇU CANDIDAT === */}
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5 mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#F5A623] mb-3 font-semibold">Candidat</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/20 shrink-0">
                    <Image
                      src={candidat.photo || "/images/logo.jpeg"}
                      alt={candidat.nom}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">{candidat.nom}</h2>
                    <DomaineBadge domaine={candidat.domaine} />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <Vote className="w-4 h-4 text-[#F5A623]" />
                    {Number(candidat.totalVotes).toLocaleString("fr-FR")} votes
                  </div>
                  <div className="text-white/80">
                    <span className="font-semibold text-[#F5A623]">{VOTE_PRICE} FCFA</span> par vote
                  </div>
                </div>
              </div>

              {/* Image du projet */}
              {projectImage && (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/10 mb-6">
                  <Image src={projectImage} alt={projectTitle} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 35vw" />
                </div>
              )}

              {/* === BOUTONS D'ACTION === */}
              <div className="space-y-3">
                {/* Voter */}
                <Link href={`/voter/${candidat.slug}`} className="inline-flex w-full items-center justify-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-bold px-5 py-3 rounded-xl transition-colors border border-white/20">
                  Voter pour ce projet
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Partager - Desktop */}
                <button
                  onClick={() => {
                    const url = projectPageUrl;
                    const text = encodeURIComponent(
                      `Découvrez le projet de ${candidat.nom} 🚀\n\n${projectTitle}\n\nVotez pour soutenir ce projet !\n\n${url}`
                    );
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Partager sur WhatsApp
                </button>

                {/* Copier lien + Actions client */}
                <ProjectActions
                  candidatSlug={candidat.slug}
                  candidatNom={candidat.nom}
                  projectTitle={projectTitle}
                  projectPageUrl={projectPageUrl}
                />
              </div>

              {/* Liens du projet */}
              {projectLinks.length > 0 && (
                <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
                  {projectLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span className="truncate">{link.label}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 text-[#F5A623]" />
                    </a>
                  ))}
                </div>
              )}

              {candidat.projectVideoUrl && (
                <a href={candidat.projectVideoUrl} target="_blank" rel="noreferrer" className="inline-flex mt-4 items-center gap-2 text-sm text-white/80 hover:text-white">
                  <Play className="w-4 h-4 text-[#F5A623]" /> Voir la vidéo du projet
                </a>
              )}
            </div>
          </div>
        </div>

        {/* === MOBILE: Aperçu + Actions en bas === */}
        <div className="lg:hidden mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          {/* Aperçu candidat */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Candidat</p>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={candidat.photo || "/images/logo.jpeg"}
                  alt={candidat.nom}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1B2A6B] truncate">{candidat.nom}</h3>
                <p className="text-xs text-gray-500">{Number(candidat.totalVotes).toLocaleString("fr-FR")} votes</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link
              href={`/voter/${candidat.slug}`}
              className="flex items-center justify-center gap-2 w-full bg-[#1B2A6B] hover:bg-[#162058] text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              <Vote className="w-4 h-4" />
              Voter
            </Link>
            <ProjectActions
              candidatSlug={candidat.slug}
              candidatNom={candidat.nom}
              projectTitle={projectTitle}
              projectPageUrl={projectPageUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
