"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordReveal({ value }: { value?: string | null }) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623]/10 px-2.5 py-1 font-semibold text-[#1B2A6B] min-w-[110px] justify-center">
        {isVisible ? value : "••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition hover:border-[#1B2A6B] hover:text-[#1B2A6B]"
      >
        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {isVisible ? "Masquer" : "Voir"}
      </button>
    </div>
  );
}
