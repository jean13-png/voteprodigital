import { notFound } from "next/navigation";
import { getCandidateById } from "@/lib/db-queries";
import CandidatForm from "@/components/admin/CandidatForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditCandidatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidat = await getCandidateById(parseInt(id));
  if (!candidat) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/candidats"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux candidats
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Modifier — {candidat.nom}
        </h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <CandidatForm
          mode="edit"
          defaultValues={{
            id: candidat.id,
            nom: candidat.nom,
            email: candidat.email,
            slug: candidat.slug,
            bio: candidat.bio ?? "",
            domaine: candidat.domaine,
            videoUrl: candidat.videoUrl ?? "",
            projectTitle: candidat.projectTitle ?? "",
            projectDescription: candidat.projectDescription ?? "",
            projectVideoUrl: candidat.projectVideoUrl ?? "",
            projectImage: candidat.projectImage ?? "",
            projectPosterImage: candidat.projectPosterImage ?? "",
            projectLinks: candidat.projectLinks ?? "",
            photo: candidat.photo ?? "",
            actif: candidat.actif,
          }}
        />
      </div>
    </div>
  );
}
