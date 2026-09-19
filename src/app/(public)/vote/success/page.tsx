import Link from "next/link";
import { CheckCircle, Share2, ArrowRight, Clock } from "lucide-react";

export const metadata = { title: "Vote soumis — ProDigital Center" };

export default function VoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ candidat?: string; voteId?: string }>;
}) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Icône succès */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#1B2A6B] mb-3">
          Vote soumis avec succès !
        </h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Votre vote a bien été enregistré. Il sera automatiquement validé
          par notre système dans les meilleurs délais.
        </p>

        {/* Étapes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 text-left space-y-3">
          {[
            {
              icon: CheckCircle,
              color: "text-green-500",
              label: "Formulaire soumis",
              done: true,
            },
            {
              icon: Clock,
              color: "text-[#F5A623]",
              label: "Validation automatique (en cours)",
              done: false,
            },
            {
              icon: CheckCircle,
              color: "text-gray-300",
              label: "Votes crédités au candidat",
              done: false,
            },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${step.color}`} />
                <span
                  className={`text-sm ${step.done ? "font-semibold text-gray-800" : "text-gray-500"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/candidats"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Voir le classement
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/candidats"
            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-[#1B2A6B] font-semibold py-3 rounded-xl transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Partager et mobiliser
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Merci de soutenir le Bootcamp Digital Academy de ProDigital Center.
        </p>
      </div>
    </div>
  );
}
