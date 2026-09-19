import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? "noreply@prodigitalcenter.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@prodigitalcenter.com";

// ─── Email admin : nouveau vote reçu ─────────────────────────────────────────

export async function sendNewVoteNotification(vote: {
  id: number;
  nomVotant: string;
  telephone: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
  preuve?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend()!;
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Nouveau vote — ${vote.nomVotant} pour ${vote.candidatNom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A6B; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Nouveau vote reçu</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">
              ProDigital Center — Bootcamp Digital Academy
            </p>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Votant</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${vote.nomVotant}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td>
                <td style="padding: 8px 0; font-size: 14px;">${vote.telephone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Candidat</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #1B2A6B;">${vote.candidatNom}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nombre de votes</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${vote.nombreVotes} vote(s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #F5A623;">${vote.montant.toLocaleString("fr-FR")} FCFA</td>
              </tr>
            </table>
            ${
              vote.preuve
                ? `<div style="margin-top: 16px;">
                    <a href="${vote.preuve}" style="display: inline-block; background: #1B2A6B; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Voir la preuve de paiement
                    </a>
                  </div>`
                : ""
            }
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="${process.env.NEXTAUTH_URL}/admin/votes" style="display: inline-block; background: #F5A623; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Valider ce vote dans l'admin
              </a>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ProDigital Center &copy; ${new Date().getFullYear()} — Bootcamp Digital Academy
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}

// ─── Email admin : vote validé ────────────────────────────────────────────────

export async function sendVoteValidatedNotification(vote: {
  nomVotant: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = getResend()!;
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Vote validé — ${vote.nombreVotes} vote(s) crédités à ${vote.candidatNom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Vote validé</h1>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #374151;">
              Le vote de <strong>${vote.nomVotant}</strong> pour <strong>${vote.candidatNom}</strong> a été validé.<br/>
              <strong>${vote.nombreVotes} vote(s)</strong> ont été crédités (${vote.montant.toLocaleString("fr-FR")} FCFA).
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}
