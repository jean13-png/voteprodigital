#!/usr/bin/env tsx
/**
 * Migration script pour ajouter la table webhook_logs
 * Exécute directement sur Neon sans utiliser Drizzle
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("📦 Début de la migration webhook_logs...");
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Créer la table
    console.log("⏳ Création de la table webhook_logs...");
    await sql.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        event VARCHAR(100) NOT NULL,
        status INTEGER NOT NULL,
        signature_received TEXT,
        signature_format VARCHAR(50),
        signature_valid BOOLEAN,
        payload TEXT,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Table créée");
    
    // Ajouter les indexes
    console.log("⏳ Ajout des indexes...");
    await sql.query("CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC)");
    console.log("✓ Index created_at créé");
    
    await sql.query("CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event)");
    console.log("✓ Index event créé");
    
    await sql.query("CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status)");
    console.log("✓ Index status créé");
    
    console.log("🎉 Migration terminée avec succès!");
    
    // Vérifier que la table existe
    const result = await sql.query(
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
