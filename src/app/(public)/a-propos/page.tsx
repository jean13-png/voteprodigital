const visionPoints = [
  "Former des professionnels compétents et opérationnels dans les métiers du numérique",
  "Offrir aux entreprises des solutions digitales innovantes pour améliorer leur visibilité et leur performance",
  "Promouvoir la culture digitale, l’esprit entrepreneurial et le leadership",
];

const objectives = [
  "Démocratiser l’accès aux compétences numériques",
  "Accompagner les entreprises dans leur transformation digitale",
  "Créer un réseau d’ambassadeurs digitaux et entrepreneuriaux",
  "Favoriser l’innovation et la créativité",
];

const values = [
  "Excellence",
  "Innovation",
  "Discipline",
  "Collaboration",
  "Impact social et économique",
];

const domains = [
  "Infrastructure et systèmes",
  "Développement et ingénierie",
  "Données et intelligence artificielle",
  "Communication et multimédia",
  "Gestion et organisation numérique",
  "Éducation et formation numérique",
  "Innovation et transformation sectorielle",
];

const academyTracks = [
  { title: "Culture Numérique", text: "Initiation aux outils digitaux et à l’automatisation pour tous les publics." },
  { title: "Séminaires de formations découvertes", text: "Informatique bureautique & IA administratives, graphisme & IA visuelles, montage audiovisuel & IA générative, développement web & IA web, marketing digital & boutique en ligne." },
  { title: "Formations professionnelles", text: "Informatique et secrétariat professionnel, graphisme professionnel & impression numérique, développement web, marketing digital & e-commerce, montage audiovisuel & création de contenus." },
  { title: "Méga-formations professionnelles", text: "Informatique 4.0 et gestion secrétariat numérique, graphisme UI/UX et design, développement web et mobile, marketing digital & e-commerce professionnel, montage audiovisuel cinématographique." },
];

const agencyServices = [
  "Création de sites web et applications",
  "Conception d’affiches publicitaires",
  "Production de vidéos promotionnelles",
  "Développement de chatbots et agents intelligents",
  "Réalisation de présentations PowerPoint professionnelles",
  "Gestion professionnelle des réseaux sociaux",
  "Mise en place de boutiques en ligne",
  "Configuration digitale complète",
  "Création de catalogues (produits/services)",
  "Création de tunnels de vente",
  "Gestion et lancement de publicités (Facebook Ads / Google Ads)",
];

const businessPrograms = [
  "Programme de croissance digitale et des affaires (PCDA)",
  "Culture numérique : maîtrise des outils digitaux",
  "Mindset : développement personnel et mentalité entrepreneuriale",
  "École des affaires : stratégies de génération de revenus",
  "Creuset des leaders : formation de leaders digitaux",
];

const studentPack = [
  "Système de revenus basé sur une matrice 3x4",
  "Gains cumulés en PV convertibles en FCFA",
  "Retrait via mobile money, banque, etc.",
  "Récompenses : ordinateur portable, moto",
];

const afriNova = [
  "Promotion des services de ProDigital Agency",
  "Revenus cumulés",
  "Revenus mensuels à vie",
  "Basés sur les contrats apportés",
];

const partnerships = [
  "Partenariats académiques et institutionnels",
  "Partenariats commerciaux et technologiques",
  "Partenariats culturels et événementiels",
];

export default function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ contact?: string }> | { contact?: string };
}) {
  const contactStatus = typeof searchParams === "object" && searchParams !== null
    ? "then" in searchParams
      ? undefined
      : searchParams.contact
    : undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623] mb-3">
          ProDigital Center
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B2A6B] leading-tight">
          À propos
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
        {contactStatus === "success" && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Votre message a bien été envoyé. Notre équipe vous répondra très prochainement.
          </div>
        )}

        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6 items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#1B2A6B] mb-4">Centre Numérique ProDigital</h2>
              <p className="text-base leading-8 text-slate-700">
                Devenir un pôle d’excellence en formation digitale, en services numériques et
                en entrepreneuriat, contribuant activement à la transformation digitale des
                entreprises et à l’émergence de leaders africains.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden border border-slate-200 bg-slate-100 h-32">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                  alt="Apprenants engagés dans une formation digitale"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden border border-slate-200 bg-slate-100 h-32">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
                  alt="Professionnels travaillant sur un projet numérique"
                  className="h-full w-full object-cover grayscale"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#1B2A6B] mb-4">Mission</h3>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              {visionPoints.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="inline-block w-2 h-2 bg-[#F5A623] rounded-full mt-2.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#1B2A6B] mb-4">Objectifs</h3>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              {objectives.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="inline-block w-2 h-2 bg-[#1B2A6B] rounded-full mt-2.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-xl font-bold text-[#1B2A6B] mb-5">Valeurs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {values.map((value) => (
              <div
                key={value}
                className="border border-slate-200 bg-white text-center px-4 py-4 text-sm font-semibold text-slate-700"
              >
                {value}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-xl font-bold text-[#1B2A6B] mb-5">Domaines numériques</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-nowrap">
            {domains.map((domain) => (
              <div
                key={domain}
                className="min-w-[220px] flex-1 border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
              >
                {domain}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">
              I. Département ProDigital Academy
            </h3>
            <p className="text-sm leading-7 text-slate-700 mb-5">
              Objectif : former et certifier des professionnels qualifiés dans les métiers du numérique.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {academyTracks.map((track) => (
                <div key={track.title} className="border border-slate-200 rounded-xl p-5 bg-white h-full">
                  <h4 className="text-base font-bold text-[#1B2A6B] mb-2">{track.title}</h4>
                  <p className="text-sm leading-7 text-slate-700">{track.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">
              II. Département ProDigital Agency
            </h3>
            <p className="text-sm leading-7 text-slate-700 mb-5">
              Objectif : accompagner les entreprises dans leur transformation digitale.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {agencyServices.map((service) => (
                <div key={service} className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                  {service}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">
              III. Département ProDigital Business
            </h3>
            <p className="text-sm leading-7 text-slate-700 mb-5">
              Objectif : développer la culture digitale, l’entrepreneuriat et les opportunités économiques.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-base font-bold text-[#1B2A6B] mb-3">Programme de croissance digitale et des affaires</h4>
                <ul className="space-y-2 text-sm leading-7 text-slate-700">
                  {businessPrograms.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="inline-block w-2 h-2 bg-[#F5A623] rounded-full mt-2.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-base font-bold text-[#1B2A6B] mb-3">Programmes économiques</h4>
                <div className="mb-4">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Student Pack</h5>
                  <ul className="space-y-2 text-sm leading-7 text-slate-700">
                    {studentPack.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="inline-block w-2 h-2 bg-[#1B2A6B] rounded-full mt-2.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">AfriNova Network</h5>
                  <ul className="space-y-2 text-sm leading-7 text-slate-700">
                    {afriNova.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="inline-block w-2 h-2 bg-[#F5A623] rounded-full mt-2.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">
              IV. Département ProDigital Partenariat
            </h3>
            <p className="text-sm leading-7 text-slate-700 mb-5">
              Objectif : développer des collaborations stratégiques.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {partnerships.map((item) => (
                <div key={item} className="border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-slate-200 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5A623] mb-2">
                Contact
              </p>
              <h3 className="text-2xl font-bold text-[#1B2A6B] mb-4">Parlons de votre projet</h3>
              <p className="text-sm leading-7 text-slate-700 mb-6">
                Que vous soyez une entreprise, une organisation ou une personne souhaitant se former,
                nous sommes à votre disposition pour vous conseiller et vous accompagner.
              </p>
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold text-[#1B2A6B]">Email :</span> contact@prodigitalcenter.com</p>
                <p><span className="font-semibold text-[#1B2A6B]">Téléphone :</span> +229 51 59 55 23</p>
                <p><span className="font-semibold text-[#1B2A6B]">Adresse :</span> Cotonou, Bénin</p>
              </div>
            </div>

            <form
              id="about-contact-form"
              className="border border-slate-200 bg-slate-50 p-5 space-y-4"
              method="post"
              action="/api/contact"
            >
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-slate-700">
                  Nom
                </label>
                <input id="contact-name" name="nom" type="text" required className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1B2A6B]" placeholder="Votre nom" />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input id="contact-email" name="email" type="email" required className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1B2A6B]" placeholder="votre@email.com" />
              </div>
              <div>
                <label htmlFor="contact-telephone" className="mb-2 block text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <input id="contact-telephone" name="telephone" type="tel" className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1B2A6B]" placeholder="+229 ..." />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea id="contact-message" name="message" rows={4} required className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1B2A6B]" placeholder="Votre message..." />
              </div>
              <button type="submit" className="inline-flex items-center justify-center bg-[#1B2A6B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162058]">
                Envoyer le message
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
