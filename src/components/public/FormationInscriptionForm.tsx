"use client";

import { FormEvent, useState } from "react";

const options = [
  "Formation professionnelle – 6 mois + stage",
  "Bourse spéciale – 35.000 FCFA",
  "Pack 1 – Métiers du numérique & IA",
  "Pack 2 – Robotique & systèmes embarqués",
  "Pack 3 – Spécialiste IA",
  "Autre / Je veux être conseillé",
];

export default function FormationInscriptionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      nom: String(formData.get("nom") ?? "").trim(),
      telephone: String(formData.get("telephone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      formation: String(formData.get("formation") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/formation/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Une erreur est survenue.");
      }

      setStatus("success");
      setMessage("Votre demande a bien été enregistrée. Notre équipe vous contactera très prochainement.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-2">
          Demande d’inscription
        </p>
        <h3 className="text-2xl font-bold text-[#1B2A6B]">Je souhaite m’inscrire</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nom" className="mb-2 block text-sm font-medium text-slate-700">
            Nom complet
          </label>
          <input
            id="nom"
            name="nom"
            required
            className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1B2A6B]"
            placeholder="Votre nom"
          />
        </div>

        <div>
          <label htmlFor="telephone" className="mb-2 block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            required
            className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1B2A6B]"
            placeholder="+229 ..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1B2A6B]"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label htmlFor="formation" className="mb-2 block text-sm font-medium text-slate-700">
            Formation souhaitée
          </label>
          <select
            id="formation"
            name="formation"
            required
            className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1B2A6B]"
            defaultValue=""
          >
            <option value="" disabled>
              Choisir une option
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1B2A6B]"
          placeholder="Décrivez votre besoin ou votre objectif..."
        />
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center bg-[#1B2A6B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#162058] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
