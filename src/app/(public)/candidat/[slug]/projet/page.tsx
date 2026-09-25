import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Vote } from "lucide-react";
import { getCandidateBySlug, VOTE_PRICE } from "@/lib/db-queries";

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
    // Support older URL patterns without a valid URL object.
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href={`/candidat/${candidat.slug}`} className="inline-flex items-center gap-2 text-sm text-[#1B2A6B] hover:text-[#F5A623] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour au profil
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
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
                  <p className="text-sm text-gray-600 mb-2">La vidéo du projet n’est pas une vidéo YouTube intégrable.</p>
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

            <div className="bg-[#1B2A6B] p-6 md:p-8 text-white">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5 mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#F5A623] mb-2">Candidat</p>
                <h2 className="text-2xl font-bold">{candidat.nom}</h2>
              </div>

              {projectImage && (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/10 mb-5">
                  <Image src={projectImage} alt={projectTitle} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 35vw" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Vote className="w-4 h-4 text-[#F5A623]" />
                  1 vote = {VOTE_PRICE} FCFA
                </div>
                <Link href={`/voter/${candidat.slug}`} className="inline-flex w-full items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#e09516] text-[#1B2A6B] font-bold px-5 py-3 rounded-xl transition-colors">
                  Voter pour ce projet
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {projectLinks.length > 0 && (
                <div className="mt-5 space-y-2">
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
      </div>
    </div>
  );
}
