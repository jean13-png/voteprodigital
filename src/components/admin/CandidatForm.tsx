"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Eye, EyeOff, User } from "lucide-react";
import { DOMAINES } from "@/lib/constants";
import Image from "next/image";
import { swalError, swalSuccess } from "@/lib/swal";

interface CandidatFormProps {
  mode: "create" | "edit";
  defaultValues?: {
    id?: number;
    nom?: string;
    email?: string;
    slug?: string;
    bio?: string;
    domaine?: string;
    videoUrl?: string;
    photo?: string;
    actif?: boolean;
  };
}

function toSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function CandidatForm({ mode, defaultValues = {} }: CandidatFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(defaultValues.photo ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [slugValue, setSlugValue] = useState(defaultValues.slug ?? "");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleNomChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (mode === "create") setSlugValue(toSlug(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const formData = new FormData();
    formData.append("nom", getValue("nom"));
    formData.append("email", getValue("email"));
    formData.append("slug", slugValue);
    formData.append("bio", getValue("bio"));
    formData.append("domaine", getValue("domaine"));
    formData.append("videoUrl", getValue("videoUrl"));
    const password = getValue("password");
    if (password) formData.append("password", password);
    if (photoFile) formData.append("photo", photoFile);

    const url =
      mode === "create"
        ? "/api/admin/candidats"
        : `/api/admin/candidats/${defaultValues.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      await swalError(
        "Erreur",
        data.error ?? "Une erreur est survenue. Réessayez."
      );
      return;
    }

    await swalSuccess(
      mode === "create" ? "Candidat ajouté" : "Modifications enregistrées",
      mode === "create"
        ? `${getValue("nom")} a bien été ajouté à la compétition.`
        : "Le profil du candidat a été mis à jour."
    );

    router.push("/admin/candidats");
    router.refresh();
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Photo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Photo du candidat
        </p>
        <div className="flex items-center gap-5">
          <div
            className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Aperçu"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                <User className="w-8 h-8" />
                <span className="text-xs">Photo</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-[#1B2A6B] border border-[#1B2A6B]/30 px-4 py-2 rounded-lg hover:bg-[#1B2A6B]/5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {photoPreview ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Supprimer la photo
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG. Uploadée automatiquement sur Cloudinary.</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      </div>

      {/* Infos principales */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Informations
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom complet <span className="text-red-400">*</span>
            </label>
            <input
              name="nom"
              defaultValue={defaultValues.nom}
              onChange={handleNomChange}
              required
              placeholder="Ex: Jean Dupont"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse email <span className="text-red-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              defaultValue={defaultValues.email}
              required
              placeholder="jean@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe
              {mode === "create" && <span className="text-red-400"> *</span>}
              {mode === "edit" && (
                <span className="text-gray-400 font-normal text-xs ml-1">(vide = inchangé)</span>
              )}
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required={mode === "create"}
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Domaine <span className="text-red-400">*</span>
            </label>
            <select name="domaine" defaultValue={defaultValues.domaine ?? ""} required className={inputClass}>
              <option value="">Sélectionner un domaine</option>
              {Object.entries(DOMAINES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lien vidéo YouTube
              <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
            </label>
            <input
              name="videoUrl"
              type="url"
              defaultValue={defaultValues.videoUrl ?? ""}
              placeholder="https://youtube.com/watch?v=..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Présentation */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Présentation
        </p>
        <textarea
          name="bio"
          defaultValue={defaultValues.bio ?? ""}
          rows={4}
          placeholder="Décrivez le candidat : son parcours, son projet, ses motivations..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#1B2A6B] hover:bg-[#162058] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? "Enregistrement..."
            : mode === "create"
            ? "Ajouter le candidat"
            : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
