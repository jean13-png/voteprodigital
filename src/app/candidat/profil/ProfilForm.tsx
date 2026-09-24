"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { swalError, swalSuccess } from "@/lib/swal";
import { csrfFetch } from "@/lib/csrf";

interface Props {
  candidatId: number;
  defaultValues: { nom: string; email?: string | null; bio: string };
}

export default function ProfilForm({ candidatId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const body: Record<string, string> = {
      nom: getValue("nom"),
      email: getValue("email"),
      bio: getValue("bio"),
      id: String(candidatId),
    };

    const oldPassword = getValue("oldPassword");
    const newPassword = getValue("newPassword");
    if (oldPassword && newPassword) {
      body.oldPassword = oldPassword;
      body.newPassword = newPassword;
    }

    const res = await csrfFetch("/api/candidat/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      await swalError("Erreur", data.error ?? "Une erreur est survenue.");
      return;
    }

    await swalSuccess("Profil mis à jour", "Vos informations ont bien été enregistrées.");
    router.refresh();
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
        <input name="nom" defaultValue={defaultValues.nom} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input name="email" type="email" defaultValue={defaultValues.email ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Présentation / Bio</label>
        <textarea name="bio" defaultValue={defaultValues.bio} rows={4} className={`${inputClass} resize-none`} />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">
          Changer le mot de passe
          <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
            <div className="relative">
              <input
                name="oldPassword"
                type={showOld ? "text" : "password"}
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Min. 8 caractères"
                minLength={8}
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e09516] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
