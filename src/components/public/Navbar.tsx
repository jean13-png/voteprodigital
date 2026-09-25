"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/candidats", label: "Candidats" },
  { href: "/a-propos", label: "À propos" },
  { href: "/formation", label: "Formation" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/images/logo.jpeg"
              alt="ProDigital Center"
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
            <div className="leading-tight">
              <span className="block text-sm font-extrabold text-[#1B2A6B] uppercase tracking-tight">
                ProDigital
              </span>
              <span className="block text-xs font-semibold text-[#F5A623] uppercase tracking-widest">
                Center
              </span>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#1B2A6B]/5 text-[#1B2A6B]"
                    : "text-gray-600 hover:text-[#1B2A6B] hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/candidat/login"
              className="text-sm font-medium text-gray-600 hover:text-[#1B2A6B] transition-colors"
            >
              Espace candidat
            </Link>
            <Link
              href="/candidats"
              className="bg-[#F5A623] hover:bg-[#e09516] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Voter maintenant
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-[#1B2A6B]/5 text-[#1B2A6B]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <Link
              href="/candidat/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Espace candidat
            </Link>
            <Link
              href="/candidats"
              onClick={() => setMobileOpen(false)}
              className="block bg-[#F5A623] text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center transition-colors"
            >
              Voter maintenant
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
