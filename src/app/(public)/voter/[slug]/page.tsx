import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCandidateBySlug, VOTE_PRICE } from "@/lib/db-queries";
import DomaineBadge from "@/components/ui/DomaineBadge";
import VoteForm from "./VoteForm";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const candidat = await getCandidateBySlug(slug);
  if (!candidat) return { title: "Voter — ProDigital Center" };

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://voteprodigital.vercel.app";
  const title = `Voter pour ${candidat.nom} — ProDigital Center 🗳️`;
  const description = `Soutenez ${candidat.nom} en votant maintenant ! 1 vote = ${VOTE_PRICE} FCFA. Bootcamp Digital Academy 2026.`;
  const image = candidat.photo ?? `${BASE_URL}/images/logo.jpeg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/voter/${slug}`,
      siteName: "ProDigital Center",
      type: "website",
      locale: "fr_FR",
      images: [{ url: image, width: 1200, height: 630, alt: candidat.nom }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function VoterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const candidat = await getCandidateBySlug(slug);

  if (!candidat) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <Link
            href={`/candidat/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil de {candidat.nom}
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Récap candidat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Vous votez pour
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {candidat.photo ? (
                    <Image
                      src={candidat.photo}
                      alt={candidat.nom}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1B2A6B]/10">
                      <span className="text-xl font-bold text-[#1B2A6B]/40">
                        {candidat.nom.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-[#1B2A6B] text-base">
                    {candidat.nom}
                  </h2>
                  <DomaineBadge domaine={candidat.domaine} />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Votes actuels</span>
                  <span className="font-semibold text-[#1B2A6B]">
                    {Number(candidat.totalVotes).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Prix unitaire</span>
                  <span className="font-semibold text-[#F5A623]">
                    {VOTE_PRICE} FCFA
                  </span>
                </div>
              </div>

              {/* MODE MANUEL DÉSACTIVÉ — numéros de paiement Mobile Money
              <div className="mt-4 bg-[#1B2A6B]/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#1B2A6B] mb-3 uppercase tracking-wide">
                  Numéros de paiement
                </p>
                <div className="space-y-2.5 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">MTN Mobile Money</p>
                    <p className="font-bold text-[#1B2A6B]">+229 01 XX XX XX XX</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Moov Money</p>
                    <p className="font-bold text-[#1B2A6B]">+229 01 XX XX XX XX</p>
                  </div>
                  <div className="pt-1 border-t border-[#1B2A6B]/10">
                    <p className="text-gray-500 text-xs">Bénéficiaire</p>
                    <p className="font-bold text-[#1B2A6B]">ProDigital Center</p>
                  </div>
                </div>
              </div>
              */}
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h1 className="text-xl font-extrabold text-[#1B2A6B] mb-1">
                Formulaire de vote
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Effectuez votre paiement Mobile Money, puis remplissez ce
                formulaire et téléchargez votre preuve de paiement.
              </p>
              <VoteForm candidatId={candidat.id} candidatSlug={slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
