"use client";

import { generateCandidateCredentials } from "@/lib/actions/student-credentials";
import { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";

export function CredentialsForm({
  generateCandidateCredentials: action,
}: {
  generateCandidateCredentials: typeof generateCandidateCredentials;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message,
        });
        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: "Une erreur est survenue lors de la génération.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input type="hidden" name="scope" value="all" />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-[#1B2A6B] transition hover:bg-[#e59a12] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          {isLoading ? "Génération..." : "Générer tout"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 flex items-start gap-3 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
    </>
  );
}
