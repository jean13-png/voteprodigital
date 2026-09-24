import { NextRequest, NextResponse } from "next/server";
import { getCandidatesRankedPaginated } from "@/lib/db-queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(999, Math.max(1, parseInt(searchParams.get("limit") ?? "8")));
    const search = searchParams.get("search") ?? "";

    const result = await getCandidatesRankedPaginated({ page, limit, search });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/candidats]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
