#!/bin/bash

# Migration script pour webhook_logs
# Utilisation: ./run-migration.sh

echo "🚀 Préparation de la migration webhook_logs..."

# Vérifier que .env.local existe
if [ ! -f .env.local ]; then
  echo "❌ Erreur: .env.local non trouvé"
  exit 1
fi

# Charger les variables d'environnement
export $(cat .env.local | grep -v '#' | xargs)

# Exécuter la migration
echo "📦 Exécution de la migration..."
npx tsx scripts/migrate-webhook-logs.ts

if [ $? -eq 0 ]; then
  echo "✅ Migration complète!"
  echo ""
  echo "📋 Prochaines étapes:"
  echo "1. Redéployer sur Vercel (git push)"
  echo "2. Tester le webhook dans l'admin/logs"
  echo ""
else
  echo "❌ Migration échouée"
  exit 1
fi
