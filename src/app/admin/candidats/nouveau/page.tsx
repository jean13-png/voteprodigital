import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CandidatForm from "@/components/admin/CandidatForm";

export default function NouveauCandidatPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/candidats"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux candidats
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Nouveau candidat
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Ajoutez un nouveau candidat à la compétition.
        </p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <CandidatForm mode="create" />
      </div>
    </div>
  );
}
