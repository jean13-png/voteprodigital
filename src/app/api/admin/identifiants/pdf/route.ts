import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { db, candidates } from "@/db";
import { getSession } from "@/lib/session";
import { isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const rows = await db
    .select({
      nom: candidates.nom,
      email: candidates.email,
      generatedPassword: candidates.generatedPassword,
    })
    .from(candidates)
    .where(isNotNull(candidates.email))
    .orderBy(candidates.nom);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  doc.fillColor("#1B2A6B").fontSize(24).font("Helvetica-Bold").text("Identifiants candidats ProDigital Center", 40, 50);
  doc.fillColor("#374151").fontSize(11).font("Helvetica").text("Liste des comptes de connexion générés pour les candidats", 40, 80);

  let y = 120;
  rows.forEach((row, index) => {
    doc.fillColor(index % 2 === 0 ? "#111827" : "#1F2937")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`${index + 1}. ${row.nom}`, 40, y);
    y += 18;
    doc.font("Helvetica").text(`Email : ${row.email ?? "—"}`, 60, y);
    y += 18;
    doc.font("Helvetica-Bold").text(`Mot de passe : ${row.generatedPassword ?? "—"}`, 60, y);
    y += 28;

    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.fillColor("#6B7280").fontSize(10).font("Helvetica").text("ProDigital Center — Bootcamp Digital Academy", 40, 780, { align: "center" });
  doc.end();

  const pdf = Buffer.concat(chunks);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="identifiants_candidats.pdf"',
    },
  });
}
