import { Resend } from "resend";
import { logError } from "@/lib/log-error";
import PDFDocument from "pdfkit";

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
    logError("Email send", err);
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
    logError("Email send", err);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = getResend()!;
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Réinitialisation de mot de passe — ProDigital Center",
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #1B2A6B; padding: 24px; border-radius: 12px 12px 0 0;"><h1 style="color: white; margin: 0; font-size: 20px;">Réinitialisation de mot de passe</h1></div><div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;"><p style="font-size: 14px; color: #374151;">Bonjour,<br/>Cliquez sur le lien pour réinitialiser votre mot de passe :</p><div style="margin-top: 20px;"><a href="${baseUrl}/candidat/mot-de-passe-oublie?token=${token}" style="display: inline-block; background: #F5A623; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Réinitialiser mon mot de passe</a></div><p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Ce lien expire dans 1 heure.</p></div><div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">ProDigital Center &copy; ${new Date().getFullYear()}</p></div></div></div>`,
    });
  } catch (err) {
    logError("Password reset email", err);
  }
}

// ─── Email votant : récépissé de vote (texte + PDF) ───────────────────────────

export interface VoteReceiptData {
  id: number;
  nomVotant: string;
  telephone: string;
  email: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
  statut: "en_attente" | "valide" | "refuse";
  createdAt: Date | string;
  fedapayReference?: string | null;
}

function generateReceiptPDF(vote: VoteReceiptData): Buffer {
  const doc = new PDFDocument({ margin: 40 });
  const buffers: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => buffers.push(chunk));

  const blue = "#1B2A6B";
  const amber = "#F5A623";

  // Header with logo
  doc
    .rect(0, 0, 600, 80)
    .fill("#ffffff")
    .lineWidth(0);

  try {
    const logoPath = process.cwd() + "/public/images/logo.jpeg";
    doc.image(logoPath, 40, 20, { width: 120 });
  } catch {
    doc
      .fillColor(blue)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("ProDigital Center", 40, 30);
  }

  doc
    .fillColor(blue)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Récépissé de vote", 40, 90);

  doc
    .fillColor("#374151")
    .fontSize(12)
    .font("Helvetica")
    .text("ProDigital Center — Bootcamp Digital Academy", { align: "center" })
    .moveDown(1);

  // Details table
  const startY = 140;
  doc.fontSize(11);

  const addRow = (y: number, label: string, value: string) => {
    doc
      .fillColor("#6b7280")
      .text(label, 60, y)
      .fillColor("#111827")
      .text(value, 180, y);
  };

  addRow(startY, "ID vote", `#${vote.id}`);
  addRow(startY + 22, "Votant", vote.nomVotant);
  addRow(startY + 44, "Téléphone", vote.telephone);
  addRow(startY + 66, "Email", vote.email);
  addRow(startY + 88, "Candidat", vote.candidatNom);
  addRow(startY + 110, "Nombre de votes", `${vote.nombreVotes} vote(s)`);
  doc
    .fillColor(amber)
    .text(`${vote.montant.toLocaleString("fr-FR")} FCFA`, 180, startY + 132);

  addRow(startY + 154, "Statut", vote.statut);
  addRow(
    startY + 176,
    "Référence paiement",
    vote.fedapayReference ?? "en_attente"
  );
  addRow(
    startY + 198,
    "Date",
    new Date(vote.createdAt).toLocaleString("fr-FR")
  );

  doc
    .fillColor(amber)
    .fontSize(10)
    .text(
      "Ce récépissé vaut facture de dépôt de vote. Conservez-le.",
      60,
      380,
      { align: "center" }
    );

  doc.end();

  return Buffer.concat(buffers);
}

export async function sendVoteReceipt(vote: VoteReceiptData) {
  if (!process.env.RESEND_API_KEY) return;
  if (!vote.email) return;

  try {
    const resend = getResend()!;
    const pdfBuffer = generateReceiptPDF(vote);

    await resend.emails.send({
      from: FROM,
      to: vote.email,
      subject: `Récépissé de vote — ${vote.nombreVotes} vote(s) pour ${vote.candidatNom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A6B; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Récépissé de vote</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">
              ProDigital Center — Bootcamp Digital Academy
            </p>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #374151;">
              Bonjour ${vote.nomVotant},
            </p>
            <p style="font-size: 14px; color: #374151; margin-top: 12px;">
              Nous vous remercions pour votre vote. Veuillez trouver ci-joint votre récépissé de vote.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
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
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Statut</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${vote.statut}</td>
              </tr>
            </table>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              ProDigital Center &copy; ${new Date().getFullYear()} — Bootcamp Digital Academy
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `receipt_vote_${vote.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } catch (err) {
    logError("Vote receipt email", err);
  }
}
