import LegalPage from "@/components/public/LegalPage";

export default function PolitiqueCookiesPage() {
  return (
    <LegalPage
      title="Politique relative aux cookies"
      intro="La plateforme utilise des cookies et technologies similaires afin de garantir le bon fonctionnement du site, améliorer l'expérience utilisateur, sécuriser l'accès et mesurer l'utilisation des services."
      sections={[
        {
          heading: "1. Définition",
          body: (
            <>
              <p>
                Les cookies sont de petits fichiers texte enregistrés sur l'appareil de
                l'utilisateur lors de la consultation du site.
              </p>
              <p>
                Ils permettent notamment de mémoriser les préférences, la session de
                navigation, certains paramètres de sécurité et les éléments nécessaires au
                bon fonctionnement de la plateforme.
              </p>
            </>
          ),
        },
        {
          heading: "2. Types de cookies utilisés",
          body: (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cookies techniques nécessaires au fonctionnement du site et à la sécurité ;</li>
                <li>Cookies de session liés à la connexion et à l'authentification ;</li>
                <li>Cookies de mesure d'audience ou de performances, si activés ;</li>
                <li>Cookies tiers nécessaires à des services intégrés ou à des analyses de mesure de trafic.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "3. Finalité",
          body: (
            <>
              <p>
                Les cookies permettent de maintenir la session, mémoriser certaines
                préférences, sécuriser les formulaires et améliorer la performance et la
                stabilité du site.
              </p>
            </>
          ),
        },
        {
          heading: "4. Gestion des cookies",
          body: (
            <>
              <p>
                L'utilisateur peut configurer son navigateur pour accepter, refuser ou
                supprimer les cookies selon ses préférences. La désactivation de certains
                cookies peut limiter certaines fonctionnalités du site.
              </p>
            </>
          ),
        },
        {
          heading: "5. Durée de conservation",
          body: (
            <>
              <p>
                Les cookies sont conservés pendant la durée nécessaire à leur finalité,
                dans les limites imposées par les lois et réglementations applicables.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
