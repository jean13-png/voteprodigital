import nodemailer from "nodemailer";
import { logError } from "@/lib/log-error";
import PDFDocument from "pdfkit";

const FROM_NAME = "ProDigital Center";
const FROM_EMAIL = process.env.GMAIL_USER ?? process.env.EMAIL_FROM ?? "prodigitalcenters@gmail.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? FROM_EMAIL;

// ─── Transporter Gmail SMTP ───────────────────────────────────────────────────

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Envoi générique ──────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Email] Gmail non configuré, email non envoyé");
    }
    return;
  }

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}

// ─── Notification admin : nouveau vote ───────────────────────────────────────

export async function sendNewVoteNotification(vote: {
  id: number;
  nomVotant: string;
  telephone: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
  preuve?: string | null;
}) {
  if (!isEmailConfigured()) return;

  try {
    const adminUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/votes`;
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🗳️ Nouveau vote — ${vote.nomVotant} pour ${vote.candidatNom}`,
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
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Votant</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${vote.nomVotant}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; font-size: 14px;">${vote.telephone}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Candidat</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #1B2A6B;">${vote.candidatNom}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nombre de votes</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${vote.nombreVotes} vote(s)</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px; color: #F5A623;">${vote.montant.toLocaleString("fr-FR")} FCFA</td></tr>
            </table>
            ${vote.preuve ? `<div style="margin-top: 16px;"><a href="${vote.preuve}" style="display: inline-block; background: #1B2A6B; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Voir la preuve de paiement</a></div>` : ""}
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="${adminUrl}" style="display: inline-block; background: #F5A623; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Valider ce vote dans l'admin</a>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">ProDigital Center &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      `,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("[Email] Notification nouveau vote envoyée");
    }
  } catch (err) {
    logError("Email sendNewVoteNotification", err);
  }
}

// ─── Notification admin : vote validé ────────────────────────────────────────

export async function sendVoteValidatedNotification(vote: {
  nomVotant: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
}) {
  if (!isEmailConfigured()) return;

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `✅ Vote validé — ${vote.nombreVotes} vote(s) pour ${vote.candidatNom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Vote validé</h1>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #374151;">
              Le vote de <strong>${vote.nomVotant}</strong> pour <strong>${vote.candidatNom}</strong> a été validé.<br/>
              <strong>${vote.nombreVotes} vote(s)</strong> crédités — ${vote.montant.toLocaleString("fr-FR")} FCFA.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logError("Email sendVoteValidatedNotification", err);
  }
}

// ─── Email réinitialisation mot de passe ─────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!isEmailConfigured()) return;
  if (!isValidEmail(email)) throw new Error("Format email invalide");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    await sendEmail({
      to: email,
      subject: "Réinitialisation de mot de passe — ProDigital Center",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A6B; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Réinitialisation de mot de passe</h1>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #374151;">Bonjour,<br/>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
            <div style="margin-top: 20px;">
              <a href="${baseUrl}/candidat/mot-de-passe-oublie?token=${token}" style="display: inline-block; background: #F5A623; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Réinitialiser mon mot de passe</a>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Ce lien expire dans 1 heure.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">ProDigital Center &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logError("Email sendPasswordResetEmail", err);
    throw err;
  }
}

// ─── Récépissé de vote avec PDF joint ────────────────────────────────────────

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

  try {
    const logoPath = process.cwd() + "/public/images/logo.jpeg";
    doc.image(logoPath, 40, 20, { width: 120 });
  } catch {
    doc.fillColor(blue).fontSize(20).font("Helvetica-Bold").text("ProDigital Center", 40, 30);
  }

  doc.fillColor(blue).fontSize(22).font("Helvetica-Bold").text("Récépissé de vote", 40, 90);
  doc.fillColor("#374151").fontSize(12).font("Helvetica")
    .text("ProDigital Center — Bootcamp Digital Academy", { align: "center" }).moveDown(1);

  const startY = 140;
  const addRow = (y: number, label: string, value: string) => {
    doc.fillColor("#6b7280").text(label, 60, y).fillColor("#111827").text(value, 220, y);
  };

  addRow(startY, "ID vote", `#${vote.id}`);
  addRow(startY + 22, "Votant", vote.nomVotant);
  addRow(startY + 44, "Téléphone", vote.telephone);
  addRow(startY + 66, "Email", vote.email);
  addRow(startY + 88, "Candidat", vote.candidatNom);
  addRow(startY + 110, "Nombre de votes", `${vote.nombreVotes} vote(s)`);
  doc.fillColor(amber).text(`${vote.montant.toLocaleString("fr-FR")} FCFA`, 220, startY + 132);
  addRow(startY + 154, "Statut", vote.statut === "valide" ? "Validé ✓" : vote.statut === "refuse" ? "Refusé" : "En attente");
  addRow(startY + 176, "Référence", vote.fedapayReference ?? "—");
  addRow(startY + 198, "Date", new Date(vote.createdAt).toLocaleString("fr-FR"));

  doc.fillColor(amber).fontSize(10)
    .text("Ce récépissé vaut facture de dépôt de vote. Conservez-le.", 60, 380, { align: "center" });

  doc.end();
  return Buffer.concat(buffers);
}

export async function sendVoteReceipt(vote: VoteReceiptData) {
  if (!isEmailConfigured()) return;
  if (!vote.email || !isValidEmail(vote.email)) return;

  try {
    const pdfBuffer = generateReceiptPDF(vote);

    await sendEmail({
      to: vote.email,
      subject: `🧾 Récépissé de vote — ${vote.nombreVotes} vote(s) pour ${vote.candidatNom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A6B; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Récépissé de vote</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">ProDigital Center — Bootcamp Digital Academy</p>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #374151;">Bonjour <strong>${vote.nomVotant}</strong>,</p>
            <p style="font-size: 14px; color: #374151; margin-top: 8px;">
              Merci pour votre vote ! Voici votre récépissé en pièce jointe.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; background: #f9fafb; border-radius: 8px; padding: 16px;">
              <tr><td style="padding: 8px 12px; color: #6b7280; font-size: 14px;">Candidat</td><td style="padding: 8px 12px; font-weight: 600; font-size: 14px; color: #1B2A6B;">${vote.candidatNom}</td></tr>
              <tr><td style="padding: 8px 12px; color: #6b7280; font-size: 14px;">Votes</td><td style="padding: 8px 12px; font-weight: 600; font-size: 14px;">${vote.nombreVotes} vote(s)</td></tr>
              <tr><td style="padding: 8px 12px; color: #6b7280; font-size: 14px;">Montant payé</td><td style="padding: 8px 12px; font-weight: 600; font-size: 14px; color: #F5A623;">${vote.montant.toLocaleString("fr-FR")} FCFA</td></tr>
              <tr><td style="padding: 8px 12px; color: #6b7280; font-size: 14px;">Référence</td><td style="padding: 8px 12px; font-size: 14px;">${vote.fedapayReference ?? "—"}</td></tr>
              <tr><td style="padding: 8px 12px; color: #6b7280; font-size: 14px;">Statut</td><td style="padding: 8px 12px; font-size: 14px;">${vote.statut === "valide" ? "✅ Validé" : vote.statut === "refuse" ? "❌ Refusé" : "⏳ En attente"}</td></tr>
            </table>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
              Le récépissé PDF est joint à cet email. Conservez-le comme preuve de votre vote.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">ProDigital Center &copy; ${new Date().getFullYear()} — Bootcamp Digital Academy</p>
          </div>
        </div>
      `,
      attachments: [{ filename: `recu_vote_${vote.id}.pdf`, content: pdfBuffer }],
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[Email] Récépissé envoyé à", vote.email);
    }
  } catch (err) {
    logError("Email sendVoteReceipt", err);
  }
}
