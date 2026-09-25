import LegalPage from "@/components/public/LegalPage";

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="La plateforme voteprodigital est éditée par ProDigital Center dans le cadre de l'organisation du Bootcamp Digital Academy. Les informations ci-dessous sont fournies à titre informatif et peuvent être mises à jour sans préavis."
      sections={[
        {
          heading: "1. Éditeur du site",
          body: (
            <>
              <p>ProDigital Center</p>
              <p>Activité : formation digitale, marketing, développement et organisation d'événements.</p>
              <p>Responsable de publication : direction ProDigital Center.</p>
            </>
          ),
        },
        {
          heading: "2. Hébergement",
          body: (
            <>
              <p>
                La plateforme est hébergée par des prestataires techniques du secteur
                informatique, selon les conditions de sécurité et de disponibilité mises en
                place pour le service.
              </p>
            </>
          ),
        },
        {
          heading: "3. Contact",
          body: (
            <>
              <p>
                Pour toute demande relative à la plateforme, vous pouvez contacter
                ProDigital Center via les moyens mis à disposition sur le site.
              </p>
            </>
          ),
        },
        {
          heading: "4. Données personnelles",
          body: (
            <>
              <p>
                Les données collectées sont utilisées pour la gestion du vote, la
                vérification des paiements, la sécurité de la plateforme, et le respect
                des obligations légales applicables.
              </p>
              <p>
                Les utilisateurs disposent des droits prévus par la réglementation sur la
                protection des données, notamment l'accès, la rectification, l'effacement,
                la limitation du traitement et l'opposition, dans les conditions prévues
                par la loi.
              </p>
            </>
          ),
        },
        {
          heading: "5. Limitation de responsabilité",
          body: (
            <>
              <p>
                L'éditeur s'efforce de maintenir la plateforme accessible et cohérente,
                sans toutefois garantir l'absence totale d'erreurs, d'interruptions ou de
                défauts techniques.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
