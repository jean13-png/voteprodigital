import { db, webhookLogs } from "@/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await db
    .select()
    .from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A6B]">
          Logs Webhook FedaPay
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Derniers {logs.length} événements reçus du webhook
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Date", "Événement", "Status", "Signature", "Valide", "Erreur"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Aucun log pour le moment.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-50/50 transition-colors ${log.status !== 200 ? "bg-red-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1B2A6B]">
                      {log.event}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === 200
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {log.signatureFormat || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {log.signatureValid ? (
                        <span className="text-green-600 font-semibold">✓ Valide</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✗ Invalide</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {log.error ? (
                        <details className="cursor-pointer">
                          <summary className="text-red-600 font-medium truncate">
                            Erreur...
                          </summary>
                          <div className="mt-2 p-3 bg-red-50 rounded text-xs text-red-800 font-mono whitespace-pre-wrap break-words max-h-32 overflow-auto">
                            {log.error}
                          </div>
                        </details>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info payload */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Chaque webhook est loggé ici. Regarde la colonne "Erreur" pour voir les tests de signature qui ont échoué.
          Si tu vois "SHA256-BASE64=true", ça veut dire que FedaPay utilise le format SHA256 en base64.
        </p>
      </div>
    </div>
  );
}
