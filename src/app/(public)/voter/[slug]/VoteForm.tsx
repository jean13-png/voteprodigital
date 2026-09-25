"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { useRef } from "react"; // MODE MANUEL DÉSACTIVÉ
// import { Upload, X, ImageIcon } from "lucide-react"; // MODE MANUEL DÉSACTIVÉ
import { Loader2, Mail, Phone, User, Hash } from "lucide-react";
import { VOTE_PRICE } from "@/lib/constants";
import { swalError, swalToast } from "@/lib/swal";

interface VoteFormProps {
  candidatId: number;
  candidatSlug: string;
}

export default function VoteForm({ candidatId, candidatSlug }: VoteFormProps) {
  const router = useRouter();
  // const fileInputRef = useRef<HTMLInputElement>(null); // MODE MANUEL DÉSACTIVÉ

  const [nombreVotes, setNombreVotes] = useState<number | "">(2);
  // const [previewUrl, setPreviewUrl] = useState<string | null>(null); // MODE MANUEL DÉSACTIVÉ
  // const [previewFile, setPreviewFile] = useState<File | null>(null); // MODE MANUEL DÉSACTIVÉ
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const montant = (nombreVotes || 0) * VOTE_PRICE;

  // MODE MANUEL DÉSACTIVÉ
  // function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) { ... }
  // function removeFile() { ... }

  function validate(data: { nomVotant: string; telephone: string; email: string; nombreVotes: number | "" }) {
    const errs: Record<string, string> = {};
    if (!data.nomVotant.trim()) errs.nomVotant = "Votre nom est requis.";
    if (!data.telephone.trim()) {
      errs.telephone = "Le numéro de téléphone est requis.";
    } else if (!/^0[1-9][0-9]{8}$/.test(data.telephone.trim())) {
      errs.telephone = "Numéro invalide (10 chiffres, ex: 0167000000).";
    }
    if (!data.email.trim()) {
      errs.email = "L'adresse email est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errs.email = "Format d'email invalide.";
    }
    if (data.nombreVotes === "" || data.nombreVotes === null || data.nombreVotes === undefined) {
      errs.nombreVotes = "Veuillez entrer un nombre de votes.";
    } else if (!Number.isInteger(data.nombreVotes) || data.nombreVotes < 2) {
      errs.nombreVotes = "Le nombre de votes doit être au moins 2 (100 FCFA minimum).";
    } else if (data.nombreVotes > 100) {
      errs.nombreVotes = "Maximum 100 votes par transaction.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const nomVotant = (form.elements.namedItem("nomVotant") as HTMLInputElement).value;
    const telephone = (form.elements.namedItem("telephone") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    const errs = validate({ nomVotant, telephone, email, nombreVotes });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidatId,
          nomVotant: nomVotant.trim(),
          telephone: telephone.trim(),
          email: email.trim(),
          nombreVotes,
        }),
      });

      const data = await res.json();

      if (res.ok && data.paymentUrl) {
        swalToast("info", "Redirection vers le paiement...");
        window.location.href = data.paymentUrl;
        return;
      }

      // MODE MANUEL DÉSACTIVÉ
      // if (previewFile) { ... mode fallback avec preuve ... }

      await swalError(
        "Erreur de paiement",
        data.error ?? "Le paiement en ligne est temporairement indisponible. Réessayez."
      );
      setLoading(false);

    } catch {
      await swalError("Erreur de connexion", "Vérifiez votre réseau et réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Votre nom complet
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="nomVotant"
            type="text"
            placeholder="Ex: Jean Dupont"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors ${errors.nomVotant ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
        {errors.nomVotant && <p className="mt-1 text-xs text-red-600">{errors.nomVotant}</p>}
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Numéro de téléphone Mobile Money
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="telephone"
            type="tel"
            placeholder="Ex: 0167000000"
            maxLength={10}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors ${errors.telephone ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          10 chiffres commençant par <strong>01</strong> — ex: <strong>0167000000</strong> (MTN/Moov Bénin)
        </p>
        {errors.telephone && <p className="mt-1 text-xs text-red-600">{errors.telephone}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Adresse email <span className="text-gray-400 font-normal">(récépissé)</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="email"
            type="email"
            placeholder="Ex: jean.dupont@email.com"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors ${errors.email ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Nombre de votes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre de votes
        </label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="nombreVotes"
            type="number"
            min={2}
            max={100}
            value={nombreVotes}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setNombreVotes("");
                setErrors((p) => ({ ...p, nombreVotes: "" }));
              } else {
                const parsed = parseInt(val);
                if (isNaN(parsed)) {
                  setErrors((p) => ({ ...p, nombreVotes: "Nombre invalide." }));
                } else if (parsed < 2) {
                  setNombreVotes(2);
                  setErrors((p) => ({ ...p, nombreVotes: "" }));
                } else if (parsed > 100) {
                  setNombreVotes(100);
                  setErrors((p) => ({ ...p, nombreVotes: "" }));
                } else {
                  setNombreVotes(parsed);
                  setErrors((p) => ({ ...p, nombreVotes: "" }));
                }
              }
            }}
            placeholder="Ex: 10"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/20 focus:border-[#1B2A6B] transition-colors ${errors.nombreVotes ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
        {errors.nombreVotes && <p className="mt-1 text-xs text-red-600">{errors.nombreVotes}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {[2, 5, 10, 20, 50, 100].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setNombreVotes(n);
                setErrors((p) => ({ ...p, nombreVotes: "" }));
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                nombreVotes === n
                  ? "bg-[#1B2A6B] text-white border-[#1B2A6B]"
                  : "border-gray-200 text-gray-600 hover:border-[#1B2A6B] hover:text-[#1B2A6B]"
              }`}
            >
              {n} vote{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Montant calculé */}
      <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Montant à payer</span>
        {nombreVotes === "" ? (
          <span className="text-sm text-gray-400 italic">Entrez un nombre de votes</span>
        ) : (
          <span className="text-xl font-extrabold text-[#F5A623]">
            {montant.toLocaleString("fr-FR")} FCFA
          </span>
        )}
      </div>


      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1B2A6B] hover:bg-[#162058] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? "Redirection vers le paiement..." : `Payer ${montant.toLocaleString("fr-FR")} FCFA et voter`}
      </button>

      <p className="text-xs text-center text-gray-400">
        Vous allez être redirigé vers la page de paiement FedaPay (Mobile Money).
      </p>
    </form>
  );
}
