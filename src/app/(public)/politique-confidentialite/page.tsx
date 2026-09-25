import LegalPage from "@/components/public/LegalPage";

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Cette politique décrit la façon dont ProDigital Center traite les données personnelles collectées au travers de la plateforme de vote et des services associés."
      sections={[
        {
          heading: "1. Données collectées",
          body: (
            <>
              <p>
                Nous pouvons collecter des informations liées à l'identité, au profil,
                à la candidature, aux votes, aux paiements et aux justificatifs fournis
                par les utilisateurs.
              </p>
              <p>
                Les données sont collectées uniquement dans le cadre de la gestion du
                vote, de la sécurité de la plateforme et du respect de nos obligations
                légales.
              </p>
            </>
          ),
        },
        {
          heading: "2. Finalités du traitement",
          body: (
            <>
              <p>Les données sont traitées pour :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>gérer l'inscription et l'identification des utilisateurs ;</li>
                <li>traiter les votes et les demandes associées ;</li>
                <li>vérifier les paiements et preuves de paiement ;</li>
                <li>assurer la sécurité, la lutte contre la fraude et la prévention des abus ;</li>
                <li>répondre à nos obligations légales et réglementaires.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "3. Conservation",
          body: (
            <>
              <p>
                Les données sont conservées pour la durée nécessaire à la gestion de
                l'événement, à la preuve de conformité et, le cas échéant, au respect des
                exigences légales applicables.
              </p>
            </>
          ),
        },
        {
          heading: "4. Partage des données",
          body: (
            <>
              <p>
                Nous ne vendons pas les données personnelles. Les données peuvent être
                partagées avec des prestataires techniques ou de paiement strictement
                nécessaires au fonctionnement de la plateforme, dans le respect des
                obligations de confidentialité applicables.
              </p>
            </>
          ),
        },
        {
          heading: "5. Sécurité",
          body: (
            <>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles
                raisonnables pour protéger les données contre la perte, la destruction,
                l'accès non autorisé ou l'altération.
              </p>
            </>
          ),
        },
        {
          heading: "6. Droits des personnes",
          body: (
            <>
              <p>
                Conformément au cadre légal applicable, les personnes concernées peuvent
                demander l'accès, la rectification, la limitation, l'effacement ou
                l'opposition au traitement de leurs données, dans les limites prévues par
                la loi.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
