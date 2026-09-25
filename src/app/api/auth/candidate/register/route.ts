import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/log-error";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "L’inscription libre des candidats est désactivée." },
    { status: 403 }
  );
}
