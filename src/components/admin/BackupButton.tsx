"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function BackupButton() {
  const [loading, setLoading] = useState(false);

  async function handleBackup() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      
      if (!res.ok) {
        throw new Error("Erreur lors du backup");
      }

      // Récupérer le fichier JSON
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Erreur: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBackup}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? "Sauvegarde en cours..." : "Sauvegarder les Données"}
    </button>
  );
}
