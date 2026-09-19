import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-[#1B2A6B]/10 mb-4">404</p>
        <h1 className="text-2xl font-extrabold text-[#1B2A6B] mb-2">
          Page introuvable
        </h1>
        <p className="text-gray-500 mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#1B2A6B] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#162058] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
