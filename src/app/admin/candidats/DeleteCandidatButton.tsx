"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { swalDelete, swalToast, swalError } from "@/lib/swal";

export default function DeleteCandidatButton({ id, nom }: { id: number; nom: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const result = await swalDelete(
      `Supprimer ${nom} ?`,
      "Toutes les données liées à ce candidat seront supprimées définitivement."
    );
    if (!result.isConfirmed) return;

    setLoading(true);
    const res = await fetch(`/api/admin/candidats/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      await swalError("Erreur", "La suppression a échoué. Réessayez.");
      return;
    }

    swalToast("success", `${nom} a été supprimé.`);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
}
