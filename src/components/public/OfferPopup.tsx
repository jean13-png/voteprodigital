"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "prodigital_offer_popup_dismissed_until_v1";
const POPUP_RESHOW_DELAY_MS = 12 * 60 * 60 * 1000;

const variants = [
  {
    title: "Pack 1 • Métiers du numérique & IA",
    badge: "Le plus populaire",
    price: "10.000 FCFA",
    description: "Pour devenir leader du digital, apprends les compétences qui ouvrent les opportunités aujourd’hui.",
    bullets: [
      "Informatique & IA administratives",
      "Graphisme & IA visuelles",
      "Audiovisuel & IA génératives",
      "Développement web & IA web",
      "Marketing digital & e-commerce",
    ],
    cta: "Découvrir le pack 1",
    href: "/formation",
  },
  {
    title: "Pack 2 • Robotique & systèmes embarqués",
    badge: "Innovation & automatisation",
    price: "10.000 FCFA",
    description: "Créez, programmez et automatisez avec les technologies du futur.",
    bullets: [
      "Internet des objets (IoT) & Arduino",
      "Systèmes embarqués & microcontrôleurs",
      "Robotique & automatisation",
      "IoT, réseaux & smart home",
      "Électronique & prototypage intelligent",
    ],
    cta: "Voir le pack 2",
    href: "/formation",
  },
  {
    title: "Pack 3 • Spécialiste IA",
    badge: "2 mois intensifs",
    price: "10.000 FCFA",
    description: "Devient spécialiste de l’intelligence artificielle et multiplie ta productivité.",
    bullets: [
      "Fondamentaux de l’IA",
      "Outils d’IA générative",
      "Création de contenus avec l’IA",
      "Prompt engineering avancé",
      "IA pour l’entreprise & automatisation",
    ],
    cta: "Je veux la formation IA",
    href: "/formation",
  },
  {
    title: "Formation professionnelle + bourse spéciale",
    badge: "Programme prioritaire",
    price: "35.000 FCFA au lieu de 100.000 FCFA",
    description: "5 voies de formation. Très bonne opportunité pour acquérir des compétences numériques réelles et accéder à un stage.",
    bullets: [
      "Développement web",
      "Informatique bureautique",
      "Graphisme",
      "Audiovisuel",
      "Marketing digital",
    ],
    cta: "Profiter de la bourse",
    href: "/formation",
  },
];

export default function OfferPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedUntil = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
    const shouldHide = Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();

    if (shouldHide) {
      setVisible(false);
      return;
    }

    if (dismissedUntil > 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedVariant = useMemo(() => {
    const index = Math.floor(Math.random() * variants.length);
    return variants[index];
  }, []);

  const handleClose = () => {
    setVisible(false);
    const dismissedUntil = Date.now() + POPUP_RESHOW_DELAY_MS;
    window.localStorage.setItem(STORAGE_KEY, String(dismissedUntil));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/30 p-4 sm:items-center">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          aria-label="Fermer la publicité"
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-200 bg-[#1B2A6B] px-6 py-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5A623]">
            {selectedVariant.badge}
          </p>
          <h3 className="mt-2 text-2xl font-bold leading-tight">{selectedVariant.title}</h3>
        </div>

        <div className="p-6">
          <p className="text-2xl font-extrabold text-[#1B2A6B] mb-3">{selectedVariant.price}</p>
          <p className="text-sm leading-7 text-slate-600 mb-5">{selectedVariant.description}</p>

          <ul className="space-y-2.5 text-sm text-slate-700 mb-6">
            {selectedVariant.bullets.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#F5A623]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={selectedVariant.href}
              onClick={handleClose}
              className="inline-flex items-center justify-center bg-[#F5A623] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e09516]"
            >
              {selectedVariant.cta}
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
