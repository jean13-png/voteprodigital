-- Migration: Add webhook_logs table
-- Date: 2026-09-26
-- Description: Create table to store webhook events for debugging

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
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
