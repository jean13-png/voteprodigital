import Link from "next/link";
import type { ReactNode } from "react";

type LegalSection = {
  heading: string;
  body: ReactNode;
};

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>

      <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Informations légales
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            {title}
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">{intro}</p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                {section.heading}
              </h2>
              <div className="text-sm leading-7 text-slate-700 space-y-3">
                {typeof section.body === "string" ? <p>{section.body}</p> : section.body}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
