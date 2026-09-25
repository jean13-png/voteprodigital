import { NextRequest, NextResponse } from "next/server";
import { db, contactMessages } from "@/db";
import { sendContactMessageNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const nom = String(formData.get("nom") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telephone = String(formData.get("telephone") ?? "").trim() || null;
    const message = String(formData.get("message") ?? "").trim();

    if (!nom || !email || !message) {
      return NextResponse.json({ error: "Nom, email et message sont obligatoires." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email invalide." }, { status: 400 });
    }

    await db.insert(contactMessages).values({
      nom,
      email,
      telephone,
      message,
    });

    await sendContactMessageNotification({ nom, email, telephone, message });

    return NextResponse.redirect(new URL("/a-propos?contact=success", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json({ error: "Erreur serveur. Merci de réessayer." }, { status: 500 });
  }
}
