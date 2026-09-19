import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export const metadata = { title: "Échec du vote — ProDigital Center" };

export default function VoteFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ candidat?: string; reason?: string }>;
}) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#1B2A6B] mb-3">
          Vote non abouti
        </h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Une erreur est survenue lors du traitement de votre vote. Votre
          paiement n&apos;a pas été débité si la transaction n&apos;était pas
          encore confirmée.
        </p>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Que faire ?
          </p>
          <ul className="space-y-2 text-sm text-gray-500 list-disc list-inside">
            <li>Réessayez en cliquant sur le bouton ci-dessous</li>
            <li>Vérifiez votre connexion internet</li>
            <li>Vérifiez que votre preuve de paiement est lisible</li>
            <li>
              Contactez-nous via WhatsApp si le problème persiste
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/candidats"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer de voter
          </Link>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-[#1B2A6B] font-semibold py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
