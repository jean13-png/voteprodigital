#!/usr/bin/env tsx
/**
 * Migration script pour ajouter la table webhook_logs
 * Exécute directement sur Neon sans utiliser Drizzle
 */

import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("📦 Début de la migration webhook_logs...");
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, "../migrations/add_webhook_logs.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    console.log("✅ Migration SQL chargée");
    
    // Exécuter les requêtes (séparées par point-virgule)
    const queries = migrationSQL
      .split(";")
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    for (const query of queries) {
      console.log(`⏳ Exécution: ${query.substring(0, 50)}...`);
      await sql(query);
      console.log("✓ Succès");
    }
    
    console.log("🎉 Migration terminée avec succès!");
    console.log("📝 Table webhook_logs créée");
    
    // Vérifier que la table existe
    const result = await sql(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'webhook_logs'"
    );
    
    if (result.length > 0) {
      console.log("✅ Vérification: Table webhook_logs existe");
    } else {
      throw new Error("Table webhook_logs n'a pas été créée");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de la migration:");
    console.error(err);
    process.exit(1);
  }
}

migrate();
