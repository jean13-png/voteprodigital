import { db, formationInscriptions } from "@/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminInscriptionsPage() {
  const rows = await db
    .select()
    .from(formationInscriptions)
    .orderBy(desc(formationInscriptions.createdAt));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Inscriptions formation
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Liste des demandes d’inscription recueillies depuis le formulaire public.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Nom
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Téléphone
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Formation
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Message
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{row.nom}</td>
                  <td className="px-5 py-3.5 text-gray-700">{row.telephone}</td>
                  <td className="px-5 py-3.5 text-gray-700">{row.email || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700">{row.formation}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-xs">{row.message || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
