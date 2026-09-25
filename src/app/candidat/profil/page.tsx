import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getCandidateById } from "@/lib/db-queries";
import ProfilForm from "./ProfilForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidatProfilPage() {
  const session = await getSession();
  if (!session || session.user?.role !== "candidate") redirect("/candidat/login");

  const candidat = await getCandidateById(parseInt(session.user.id));
  if (!candidat) redirect("/candidat/login");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          href="/candidat/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1B2A6B] mb-6">
          Mon profil
        </h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <ProfilForm
            candidatId={candidat.id}
            defaultValues={{
              nom: candidat.nom,
              email: candidat.email,
              bio: candidat.bio ?? "",
              projectTitle: candidat.projectTitle ?? "",
              projectDescription: candidat.projectDescription ?? "",
              projectVideoUrl: candidat.projectVideoUrl ?? "",
              projectImage: candidat.projectImage ?? "",
              projectPosterImage: candidat.projectPosterImage ?? "",
              projectLinks: candidat.projectLinks ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
