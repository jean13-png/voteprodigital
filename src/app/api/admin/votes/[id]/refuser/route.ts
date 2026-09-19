import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const voteId = parseInt(id);

  await db
    .update(votes)
    .set({ statut: "refuse", commentaireAdmin: "Refusé par l'administrateur" })
    .where(eq(votes.id, voteId));

  return NextResponse.json({ success: true });
}
