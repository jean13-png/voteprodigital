import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates, users } from "@/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer toutes les données
    const [candidatsData, votesData, usersData] = await Promise.all([
      db.select().from(candidates),
      db.select().from(votes),
      db.select().from(users),
    ]);

    // Créer le backup
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        candidates: candidatsData,
        votes: votesData,
        users: usersData,
      },
      summary: {
        totalCandidates: candidatsData.length,
        totalVotes: votesData.length,
        totalAdmins: usersData.length,
      },
    };

    // Retourner comme fichier JSON
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("[Backup] Erreur:", err);
    return NextResponse.json({ error: "Erreur lors du backup" }, { status: 500 });
  }
}
