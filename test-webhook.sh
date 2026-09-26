#!/bin/bash

# Script de test du webhook FedaPay local
# Usage: ./test-webhook.sh [reference]

REFERENCE=${1:-"REF-TEST-123"}
WEBHOOK_SECRET=${FEDAPAY_WEBHOOK_SECRET:-"wh_live_TtJCFuztRYwwS4LXgut5Z3wy"}
URL=${2:-"http://localhost:3000/api/webhook/fedapay"}

# Payload de test (transaction.approved)
PAYLOAD='{
  "entity": {
    "id": 12345,
    "reference": "'$REFERENCE'",
    "status": "approved",
    "amount": 500,
    "description": "Test webhook"
  },
  "event": "transaction.approved"
}'

echo "🧪 Test du webhook FedaPay"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: $URL"
echo "Reference: $REFERENCE"
echo ""
echo "Payload:"
echo "$PAYLOAD" | jq .
echo ""

# Calculer la signature HMAC SHA256
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

echo "Signature calculée: ${SIGNATURE:0:50}..."
echo ""

# Envoyer la requête
echo "📡 Envoi de la requête..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-fedapay-signature: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Succès (HTTP $HTTP_CODE)"
else
  echo "❌ Échec (HTTP $HTTP_CODE)"
fi

echo ""
echo "Réponse du serveur:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Vérifiez maintenant dans l'admin : /admin/logs"
