"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const promos = [
  {
    kicker: "Formation digitale",
    title: "Passez au niveau supérieur",
    description: "Des parcours pratiques en IA, design, marketing digital et développement web pour accélérer votre carrière.",
    href: "/formation",
    label: "Découvrir les formations",
  },
  {
    kicker: "Bootcamp 2026",
    title: "Des talents qui créent l'avenir",
    description: "Un programme immersif pour développer des compétences concrètes, visibles et directement utiles sur le marché.",
    href: "/a-propos",
    label: "En savoir plus",
  },
  {
    kicker: "Projet en action",
    title: "Faites grandir votre visibilité",
    description: "Mettez en avant votre projet, votre idée et votre potentiel avec une présence numérique professionnelle.",
    href: "/candidats",
    label: "Voir les candidats",
  },
  {
    kicker: "Innovation",
    title: "IA, design & commerce digital",
    description: "Des compétences qui allient créativité, marketing, stratégie et exécution pour performer dans le numérique.",
    href: "/formation",
    label: "Je veux m'inscrire",
  },
];

export default function HeroPromoSlider() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * promos.length));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % promos.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const current = promos[index];

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-5 sm:p-6 shadow-lg shadow-[#0f1d5b]/20 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F5A623]">
            {current.kicker}
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/80">
            {index + 1}/{promos.length}
          </span>
        </div>

        <h3 className="text-2xl font-extrabold leading-tight text-white mb-3">
          {current.title}
        </h3>

        <p className="text-sm leading-6 text-white/75 mb-5 min-h-[72px]">
          {current.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <Link
            href={current.href}
            className="inline-flex items-center justify-center bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-[#1B2A6B] transition hover:bg-[#e8a21b]"
          >
            {current.label}
          </Link>
          <div className="flex items-center gap-1.5">
            {promos.map((promo, promoIndex) => (
              <span
                key={promo.title}
                className={`h-1.5 rounded-full transition-all ${
                  promoIndex === index ? "w-8 bg-[#F5A623]" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
