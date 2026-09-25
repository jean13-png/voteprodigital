import FormationInscriptionForm from "@/components/public/FormationInscriptionForm";

const professionalTracks = [
  {
    name: "Formation professionnelle",
    duration: "6 mois + 3 mois de stage",
    price: "100.000 FCFA",
    note: "La formation professionnelle standard, avec stage intégré pour une mise en pratique réelle.",
    bullets: [
      "Accompagnement pratique sur des projets concrets",
      "Méthodes de travail professionnelles et outils du numérique",
      "Préparation à l’insertion professionnelle",
      "Stage de 3 mois pour consolider les compétences",
    ],
  },
  {
    name: "Bourse spéciale",
    duration: "Offre prioritaire",
    price: "35.000 FCFA",
    note: "Le même programme, mais avec l’avantage d’une bourse spéciale qui réduit le coût à 35.000 FCFA.",
    bullets: [
      "Accès à la même formation professionnelle",
      "Aide financière pour rendre l’apprentissage plus accessible",
      "Suivi renforcé et accompagnement personnalisé",
      "Idéal pour les profils motivés et en quête d’opportunité",
    ],
  },
];

const bootcampPacks = [
  {
    title: "PACK 1 : MÉTIERS DU NUMÉRIQUE & IA",
    subtitle: "Pour devenir Leader du Digital",
    items: [
      "Informatique & IA Administratives",
      "Graphisme & IA Visuelles",
      "Audiovisuel & IA Génératives",
      "Développement Web & IA Web",
      "Marketing Digital & E-Commerce",
    ],
    price: "10.000 FCFA",
  },
  {
    title: "PACK 2 : ROBOTIQUE & SYSTÈMES EMBARQUÉS INTELLIGENTS",
    subtitle: "Créez. Programmez. Automatisez.",
    items: [
      "Internet des Objets (IoT) & Arduino",
      "Systèmes Embarqués & Microcontrôleurs (ESP32)",
      "Robotique & Automatisation",
      "IoT, Réseaux & Smart Home",
      "Électronique & Prototypage Intelligent",
    ],
    price: "10.000 FCFA",
  },
  {
    title: "PACK 3 : SPÉCIALISTE INTELLIGENCE ARTIFICIELLE",
    subtitle: "Vous voulez devenir spécialiste de l’IA ?",
    items: [
      "Fondamentaux de l’Intelligence Artificielle",
      "Maîtrise des Outils d’IA Générative",
      "Création de Contenus avec l’IA",
      "Prompt Engineering & IA Avancée",
      "IA pour l’Entreprise, Productivité & Automatisation",
    ],
    price: "10.000 FCFA",
  },
];

export default function FormationPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-3">
          ProDigital Center
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B2A6B] leading-tight">
          Formation
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
        <section className="mb-12">
          <div className="bg-[#1B2A6B] text-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-3">
              Bootcamp Digital
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Votre avenir numérique commence ici.
            </h2>
            <p className="text-base text-slate-200 leading-7 max-w-3xl">
              Apprenez. Créez. Innovez. Deux packs au choix, 100 % pratique. Chaque pack
              complet : 10.000 FCFA seulement.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-2xl font-bold text-[#1B2A6B] mb-5">
            Formation professionnelle
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {professionalTracks.map((track) => (
              <div key={track.name} className="border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                  {track.duration}
                </p>
                <h4 className="text-xl font-bold text-[#1B2A6B] mb-3">{track.name}</h4>
                <p className="text-2xl font-extrabold text-[#1B2A6B] mb-2">{track.price}</p>
                <p className="text-sm text-slate-600 mb-4">{track.note}</p>
                <ul className="space-y-2 text-sm leading-7 text-slate-700">
                  {track.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="inline-block w-2 h-2 bg-[#F5A623] rounded-full mt-2.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-2xl font-bold text-[#1B2A6B] mb-6">Bootcamp Digital – 2 mois</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {bootcampPacks.map((pack) => (
              <article key={pack.title} className="border border-slate-200 bg-white p-5 h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-3">
                  {pack.price}
                </p>
                <h4 className="text-lg font-bold text-[#1B2A6B] leading-7 mb-3">{pack.title}</h4>
                <p className="text-sm font-medium text-slate-600 mb-4">{pack.subtitle}</p>
                <ul className="space-y-3 text-sm leading-7 text-slate-700">
                  {pack.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="inline-block w-2 h-2 bg-[#1B2A6B] rounded-full mt-2.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-2">
              Inscription rapide
            </p>
            <h3 className="text-2xl font-bold text-[#1B2A6B]">Demande d’inscription formation</h3>
          </div>
          <FormationInscriptionForm />
        </section>

        <section className="border-t border-slate-200 pt-8 mt-10">
          <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">Ce que tu reçois</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="font-semibold text-[#1B2A6B] mb-2">Durée</p>
              <p>2 mois intensifs</p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50">
              <p className="font-semibold text-[#1B2A6B] mb-2">Offert</p>
              <p>T-shirt, documents gratuits, attestation garantie, stage pratique offert</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
