import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const { db, users } = await import("../db");

  const email = "tossajean13@gmail.com";
  const password = "TOSjea13#";
  const name = "Administrateur ProDigital";

  // Supprimer l'ancien admin
  await db.delete(users).where(eq(users.email, "admin@prodigitalcenter.com"));
  console.log("Ancien admin supprimé");

  // Supprimer si existe déjà
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    await db.delete(users).where(eq(users.email, email));
    console.log("Ancien compte supprimé");
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ name, email, password: hashed, role: "admin" });

  console.log("Admin créé :");
  console.log(`  Email    : ${email}`);
  console.log(`  Mot de passe : ${password}`);
  console.log(`\nChangez le mot de passe après la première connexion !`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});