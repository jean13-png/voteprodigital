import { db, candidates } from "@/db";
import { PasswordReveal } from "@/components/admin/PasswordReveal";
import { generateCandidateCredentials } from "@/lib/actions/student-credentials";
import { asc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Download, KeyRound } from "lucide-react";
import { CredentialsForm } from "@/components/admin/CredentialsForm";

export const dynamic = "force-dynamic";

export default async function AdminIdentifiantsPage() {
  const rows = await db
    .select({
      id: candidates.id,
      nom: candidates.nom,
      email: candidates.email,
      generatedPassword: candidates.generatedPassword,
      updatedAt: candidates.updatedAt,
    })
    .from(candidates)
    .where(isNotNull(candidates.email))
    .orderBy(asc(candidates.nom));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-5 rounded-2xl border border-[#1B2A6B]/10 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#1B2A6B] p-1 shadow-sm ring-1 ring-[#1B2A6B]/10">
            <img
              src="/images/logo.jpeg"
              alt="ProDigital Center"
              className="h-full w-full rounded-lg object-cover"
            />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-[#1B2A6B]">ProDigital Center</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5A623]">
              ProDigital • Admin
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
            Identifiants candidats
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Comptes de connexion générés pour chaque candidat avec email associé.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CredentialsForm generateCandidateCredentials={generateCandidateCredentials} />

          <a
            href="/api/admin/identifiants/pdf"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A6B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#162058]"
          >
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Candidat
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mot de passe
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    Aucun identifiant n'a été généré pour le moment.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{row.nom}</td>
                    <td className="px-5 py-3.5 text-gray-700">{row.email}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {row.generatedPassword ? (
                        <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623]/10 px-2.5 py-1.5 font-semibold text-[#1B2A6B]">
                          <KeyRound className="h-3.5 w-3.5" />
                          <PasswordReveal value={row.generatedPassword} />
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Non généré</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString("fr-FR") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
