import LegalPage from "@/components/public/LegalPage";

export default function CGUPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      intro="Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme de vote ProDigital Center. Elles définissent les droits et obligations des utilisateurs et de l'organisateur de l'événement."
      sections={[
        {
          heading: "1. Objet",
          body: (
            <>
              <p>
                La plateforme a pour objet de permettre au public de découvrir les
                candidats du Bootcamp Digital Academy et de voter selon les règles de
                l'événement.
              </p>
              <p>
                L'organisateur se réserve le droit de modifier, suspendre ou clôturer la
                plateforme à tout moment, notamment pour des raisons de sécurité,
                d'intégrité de l'événement ou de conformité réglementaire.
              </p>
            </>
          ),
        },
        {
          heading: "2. Accès et inscription",
          body: (
            <>
              <p>
                L'accès aux fonctionnalités de vote requiert l'utilisation d'un dispositif
                compatible et une validation du paiement ou du formulaire requis selon les
                modalités annoncées.
              </p>
              <p>
                L'utilisateur s'engage à fournir des informations exactes et à ne pas
                usurper l'identité d'un tiers.
              </p>
            </>
          ),
        },
        {
          heading: "3. Règles de vote",
          body: (
            <>
              <p>
                Chaque vote doit être effectué dans le respect des règles de la
                compétition. Les votes ne sont valides que s'ils sont effectués selon les
                procédures affichées sur la plateforme et soumis aux contrôles de
                l'organisateur.
              </p>
              <p>
                L'organisateur peut rejeter tout vote jugé frauduleux, incomplet,
                multiple, invalide ou non conforme aux règles de l'événement.
              </p>
            </>
          ),
        },
        {
          heading: "4. Paiement et preuve",
          body: (
            <>
              <p>
                Pour les votes payants, l'utilisateur doit effectuer le paiement selon les
                modalités indiquées et fournir la preuve requise dans le formulaire de
                vote.
              </p>
              <p>
                Les paiements sont traités selon les moyens de paiement mis à disposition
                par l'organisateur. Les données de paiement sont traitées conformément aux
                dispositions légales applicables et à la politique de confidentialité.
              </p>
            </>
          ),
        },
        {
          heading: "5. Responsabilité",
          body: (
            <>
              <p>
                L'organisateur met en œuvre des moyens raisonnables pour assurer le bon
                fonctionnement de la plateforme, sans garantir une disponibilité
                continue ou sans interruption.
              </p>
              <p>
                L'organisateur ne saurait être tenu responsable des interruptions,
                dysfonctionnements, pertes de données ou dommages résultant de causes
                extérieures, notamment des services tiers, de la connexion internet, ou de
                la mauvaise utilisation de la plateforme par l'utilisateur.
              </p>
            </>
          ),
        },
        {
          heading: "6. Propriété intellectuelle",
          body: (
            <>
              <p>
                Tous les contenus de la plateforme, y compris les textes, visuels,
                logos, données et éléments graphiques, sont protégés par les droits de
                propriété intellectuelle applicables.
              </p>
              <p>
                Toute reproduction, diffusion ou utilisation non autorisée est prohibée,
                sauf accord explicite de l'organisateur.
              </p>
            </>
          ),
        },
        {
          heading: "7. Modifications",
          body: (
            <>
              <p>
                L'organisateur peut modifier les présentes conditions à tout moment.
                Les modifications prennent effet dès leur publication sur la plateforme.
              </p>
              <p>
                L'utilisateur est invité à consulter régulièrement ces conditions afin de
                prendre connaissance des évolutions.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
