/**
 * Script de création du compte administrateur initial.
 * Usage : npx tsx src/scripts/seed-admin.ts
 */
import { db, users } from "../db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.ADMIN_EMAIL_SEED ?? "admin@prodigitalcenter.com";
  const password = process.env.ADMIN_PASSWORD_SEED;
  if (!password) {
    console.error("ADMIN_PASSWORD_SEED est requis dans .env.local");
    process.exit(1);
  }
  const name = "Administrateur ProDigital";

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    console.log(`Admin déjà existant : ${email}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ name, email, password: hashed, role: "admin" });

  console.log(`Admin créé avec succès :`);
  console.log(`  Email    : ${email}`);
  console.log(`\nChangez le mot de passe après la première connexion !`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
