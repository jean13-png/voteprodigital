import { db, contactMessages } from "@/db";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquareText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B2A6B] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">Messages de contact</h1>
        <p className="text-gray-500 text-sm mt-1">
          Consultez les demandes envoyées depuis le formulaire de la page À propos.
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
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Téléphone
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    Aucun message reçu pour le moment.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{row.nom}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#1B2A6B]" />
                        {row.email}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{row.telephone || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-md">
                      <span className="inline-flex items-start gap-2">
                        <MessageSquareText className="h-3.5 w-3.5 mt-1 text-[#F5A623]" />
                        <span>{row.message}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("fr-FR")}
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
