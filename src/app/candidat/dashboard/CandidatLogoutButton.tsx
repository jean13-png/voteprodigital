"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function CandidatLogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/candidat/login" })}
      className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" /> Déconnexion
    </button>
  );
}
