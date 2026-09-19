"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActifButton({ id, actif }: { id: number; actif: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(actif);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/candidats/${id}/toggle`, { method: "PATCH" });
    setCurrent(!current);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        current ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          current ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
